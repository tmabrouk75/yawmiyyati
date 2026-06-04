'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface Task {
  id:          string
  title:       string
  isCompleted: boolean
  completedAt: string | null
  sortOrder:   number
  createdAt:   string
}

const T = {
  en: {
    title:       'My Space',
    tasksTab:    'To-Do',
    groupsTab:   'Groups',
    addPh:       'Add a task...',
    add:         'Add',
    empty:       'No tasks yet. Add one above.',
    emptyDone:   'Nothing completed today.',
    pending:     'To do',
    completed:   'Done',
    archive:     'Completed items archive after 3 days.',
    deleteConf:  'Delete this task?',
    groups:      'Groups',
    groupsSub:   'Collaborate with other Muslims on shared goals.',
    openGroups:  'Open Groups',
  },
  ar: {
    title:       'مساحتي',
    tasksTab:    'المهام',
    groupsTab:   'المجموعات',
    addPh:       'أضف مهمة...',
    add:         'إضافة',
    empty:       'لا مهام بعد. أضف واحدة أعلاه.',
    emptyDone:   'لم تنجز شيئاً بعد.',
    pending:     'قيد التنفيذ',
    completed:   'مكتملة',
    archive:     'تُؤرشف المهام المكتملة بعد 3 أيام.',
    deleteConf:  'حذف هذه المهمة؟',
    groups:      'المجموعات',
    groupsSub:   'تعاون مع مسلمين آخرين لتحقيق أهداف مشتركة.',
    openGroups:  'فتح المجموعات',
  },
}

export default function Features() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [tab,    setTab]    = useState<'tasks' | 'groups'>('tasks')
  const [tasks,  setTasks]  = useState<Task[]>([])
  const [input,  setInput]  = useState('')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  // ── Drag state
  const [dragging,   setDragging]   = useState<string | null>(null)
  const [dragOver,   setDragOver]   = useState<string | null>(null)
  const dragStartY   = useRef(0)
  const dragItemRef  = useRef<string | null>(null)

  const pendingTasks   = tasks.filter(t => !t.isCompleted)
  const completedTasks = tasks.filter(t => t.isCompleted)

  // ── Load tasks
  const loadTasks = useCallback(async () => {
    const res  = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data.tasks ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  // ── Add task
  const addTask = async () => {
    if (!input.trim() || saving) return
    setSaving(true)
    const res  = await fetch('/api/tasks', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: input.trim() }),
    })
    const data = await res.json()
    setTasks(prev => [data.task, ...prev])
    setInput('')
    setSaving(false)
  }

  // ── Toggle complete
  const toggleComplete = async (task: Task) => {
    const newVal = !task.isCompleted
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: newVal, completedAt: newVal ? new Date().toISOString() : null } : t))
    await fetch(`/api/tasks/${task.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isCompleted: newVal }),
    })
  }

  // ── Delete task
  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  // ── Save reorder to server (debounced)
  const reorderTimer = useRef<NodeJS.Timeout>()
  const saveOrder = (newOrder: Task[]) => {
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(() => {
      const pending = newOrder.filter(t => !t.isCompleted)
      fetch('/api/tasks/reorder', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ order: pending.map(t => t.id) }),
      })
    }, 600)
  }

  // ── Touch drag handlers
  const onTouchStart = (e: React.TouchEvent, id: string) => {
    dragItemRef.current = id
    dragStartY.current  = e.touches[0].clientY
    setDragging(id)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragItemRef.current) return
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const row = el?.closest('[data-task-id]') as HTMLElement | null
    if (row) {
      const overId = row.getAttribute('data-task-id')
      if (overId && overId !== dragItemRef.current) setDragOver(overId)
    }
  }

  const onTouchEnd = () => {
    if (dragItemRef.current && dragOver && dragOver !== dragItemRef.current) {
      setTasks(prev => {
        const pending   = prev.filter(t => !t.isCompleted)
        const completed = prev.filter(t => t.isCompleted)
        const fromIdx   = pending.findIndex(t => t.id === dragItemRef.current)
        const toIdx     = pending.findIndex(t => t.id === dragOver)
        if (fromIdx === -1 || toIdx === -1) return prev
        const reordered = [...pending]
        const [moved]   = reordered.splice(fromIdx, 1)
        reordered.splice(toIdx, 0, moved)
        const updated   = reordered.map((t, i) => ({ ...t, sortOrder: i }))
        saveOrder(updated)
        return [...updated, ...completed]
      })
    }
    setDragging(null)
    setDragOver(null)
    dragItemRef.current = null
  }

  return (
    <div dir={dir} className="flex flex-col h-full bg-gray-50">

      {/* Header */}
      <div className={cn('px-4 pt-4 pb-3 flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
        <h1 className="text-[19px] font-bold text-gray-900">{t.title}</h1>
      </div>

      {/* Tab pills */}
      <div className={cn('flex gap-2 px-4 mb-3', dir === 'rtl' && 'flex-row-reverse')}>
        {(['tasks', 'groups'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={cn('px-4 py-[7px] rounded-full text-[12px] font-semibold border transition-all',
              tab === tabKey ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200')}>
            {tabKey === 'tasks' ? t.tasksTab : t.groupsTab}
          </button>
        ))}
      </div>

      {/* ── TASKS TAB ── */}
      {tab === 'tasks' && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Add task input */}
          <div className={cn('mx-4 mb-3 flex gap-2', dir === 'rtl' && 'flex-row-reverse')}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder={t.addPh}
              dir={dir}
              className="flex-1 h-[42px] rounded-[12px] border border-gray-200 bg-white px-3 text-[13px] focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={addTask}
              disabled={!input.trim() || saving}
              className="h-[42px] px-4 rounded-[12px] bg-emerald-600 text-white text-[13px] font-semibold disabled:opacity-40 active:opacity-80"
            >
              {saving ? '...' : t.add}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-6 px-4">

            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-[52px] bg-gray-100 rounded-[12px] animate-pulse"/>)}
              </div>
            ) : (
              <>
                {/* Pending tasks */}
                {pendingTasks.length > 0 && (
                  <div className="mb-4">
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal text-[11px]')}>
                      {t.pending}
                    </p>
                    <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
                      {pendingTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          data-task-id={task.id}
                          onTouchStart={e => onTouchStart(e, task.id)}
                          onTouchMove={onTouchMove}
                          onTouchEnd={onTouchEnd}
                          className={cn(
                            'flex items-center gap-3 px-3 py-[13px] transition-all select-none',
                            idx < pendingTasks.length - 1 && 'border-b border-gray-100',
                            dragging === task.id && 'opacity-40 bg-emerald-50',
                            dragOver  === task.id && 'border-t-2 border-emerald-400',
                            dir === 'rtl' && 'flex-row-reverse'
                          )}
                        >
                          {/* Drag handle */}
                          <div className="text-gray-300 text-[16px] cursor-grab active:cursor-grabbing touch-none flex-shrink-0 px-1">
                            ⠿
                          </div>

                          {/* Checkbox */}
                          <button
                            onClick={() => toggleComplete(task)}
                            className="w-[22px] h-[22px] rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 active:bg-gray-100"
                          />

                          {/* Title */}
                          <span className={cn('flex-1 text-[14px] text-gray-800', dir === 'rtl' && 'text-right')}>
                            {task.title}
                          </span>

                          {/* Delete */}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-300 text-[16px] active:text-red-400 flex-shrink-0 px-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingTasks.length === 0 && completedTasks.length === 0 && (
                  <p className="text-center text-[13px] text-gray-400 mt-10">{t.empty}</p>
                )}

                {/* Completed tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal text-[11px]')}>
                      {t.completed}
                    </p>
                    <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
                      {completedTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-[13px]',
                            idx < completedTasks.length - 1 && 'border-b border-gray-100',
                            dir === 'rtl' && 'flex-row-reverse'
                          )}
                        >
                          {/* Spacer for drag handle */}
                          <div className="w-[24px] flex-shrink-0"/>

                          {/* Checkbox — filled green */}
                          <button
                            onClick={() => toggleComplete(task)}
                            className="w-[22px] h-[22px] rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                          >
                            <span className="text-white text-[11px] font-bold">✓</span>
                          </button>

                          {/* Title — strikethrough */}
                          <span className={cn('flex-1 text-[14px] text-gray-400 line-through', dir === 'rtl' && 'text-right')}>
                            {task.title}
                          </span>

                          {/* Delete */}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-300 text-[16px] active:text-red-400 flex-shrink-0 px-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className={cn('text-[11px] text-gray-400 mt-2 text-center')}>
                      🗂 {t.archive}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── GROUPS TAB ── */}
      {tab === 'groups' && (
        <div className="flex-1 overflow-y-auto pb-6 px-4">
          <div className="bg-white border border-gray-200 rounded-[14px] p-5 flex flex-col items-center text-center gap-3 mt-2">
            <span className="text-[40px]">👥</span>
            <p className="text-[15px] font-semibold text-gray-900">{t.groups}</p>
            <p className="text-[13px] text-gray-400 leading-relaxed max-w-[260px]">{t.groupsSub}</p>
            <button
              onClick={() => router.push('/groups')}
              className="mt-1 px-6 py-[11px] rounded-[12px] bg-emerald-600 text-white text-[13px] font-semibold active:opacity-80"
            >
              {t.openGroups}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
