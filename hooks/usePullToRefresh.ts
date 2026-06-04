import { useRef, useEffect, useState } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 64) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [pulling,  setPulling]  = useState(false)
  const [pullY,    setPullY]    = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const startY  = useRef(0)
  const active  = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY
        active.current = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && el.scrollTop === 0) {
        e.preventDefault()
        setPulling(true)
        setPullY(Math.min(delta * 0.5, threshold + 20))
      }
    }

    const onTouchEnd = async () => {
      if (!active.current) return
      active.current = false
      if (pulling && pullY >= threshold * 0.5) {
        setRefreshing(true)
        setPulling(false)
        setPullY(0)
        await onRefresh()
        setRefreshing(false)
      } else {
        setPulling(false)
        setPullY(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onRefresh, pulling, pullY, threshold])

  return { scrollRef, pulling, pullY, refreshing }
}
