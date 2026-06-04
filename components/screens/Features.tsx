'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────

interface Task {
  id: string; title: string; isCompleted: boolean
  completedAt: string | null; sortOrder: number; createdAt: string
}

interface DiaryEntry {
  id: string; customTitle: string | null; content: string
  format: string; createdAt: string
}

// ── Translations ──────────────────────────────────────────

const T = {
  en: {
    title:        'My Space',
    tasksTab:     'To-Do',
    diaryTab:     'Diary',
    groupsTab:    'Groups',
    addTaskPh:    'Add a task...',
    add:          'Add',
    noTasks:      'No tasks yet. Add one above.',
    pending:      'To do',
    done:         'Done',
    archiveNote:  'Completed items archive after 3 days.',
    groups:       'Groups',
    groupsSub:    'Collaborate with other Muslims on shared goals.',
    openGroups:   'Open Groups',
    diaryPh:      'Write your thoughts...',
    diaryTitlePh: 'Title (optional)',
    save:         'Save',
    noEntries:    'No entries yet. Start writing.',
    fmtText:      'Aa',
    fmtBullets:   '•',
    fmtNumbered:  '1.',
    refreshing:   'Refreshing...',
  },
  ar: {
    title:        'مساحتي',
    tasksTab:     'المهام',
    diaryTab:     'اليوميات',
    groupsTab:    'المجموعات',
    addTaskPh:    'أضف مهمة...',
    add:          'إضافة',
    noTasks:      'لا مهام بعد. أضف واحدة أعلاه.',
    pending:      'قيد التنفيذ',
    done:         'مكتملة',
    archiveNote:  'تُؤرشف المهام المكتملة بعد 3 أيام.',
    groups:       'المجموعات',
    groupsSub:    'تعاون مع مسلمين آخرين لتحقيق أهداف مشتركة.',
    openGroups:   'فتح المجموعات',
    diaryPh:      'اكتب أفكارك...',
    diaryTitlePh: 'العنوان (اختياري)',
    save:         'حفظ',
    noEntries:    'لا مدخلات بعد. ابدأ الكتابة.',
    fmtText:      'Aa',
    fmtBullets:   '•',
    fmtNumbered:  '1.',
    refreshing:   'جارٍ التحديث...',
  },
}

// ── Diary entry title formatter ───────────────────────────

function formatEntryDate(iso: string, lang: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const time = d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return `${date} · ${time}`
}

// ── Render diary content by format ───────────────────────

function DiaryContent({ content, format, dir, preview }: { content: string; format: string; dir: string; preview?: boolean }) {
  const allLines = content.split('\n').filter(l => l.trim())
  const lines    = preview ? allLines.slice(0, 2) : allLines
  const hasMore  = preview && allLines.length > 2

  // Content-driven: each line renders based on its own prefix,
  // so a single entry can mix paragraphs and bullet/numbered lists.
  type Seg = { type: 'text' | 'bullets' | 'numbered'; items: string[] }
  const segments: Seg[] = []
  for (const line of lines) {
    const type = /^[•\-]\s/.test(line) ? 'bullets' : /^\d+\.\s/.test(line) ? 'numbered' : 'text'
    const last = segments[segments.length - 1]
    if (last && last.type === type) last.items.push(line)
    else segments.push({ type, items: [line] })
  }

  return (
    <div className={cn('mt-1 space-y-[3px]', dir === 'rtl' && 'text-right')}>
      {segments.map((seg, si) => {
        if (seg.type === 'bullets') return (
          <ul key={si} className="space-y-[2px]" style={{ paddingInlineStart: 16 }}>
            {seg.items.map((l, i) => (
              <li key={i} className="text-[13px] text-gray-700 list-disc">{l.replace(/^[•\-]\s+/, '')}</li>
            ))}
          </ul>
        )
        if (seg.type === 'numbered') return (
          <ol key={si} className="space-y-[2px]" style={{ paddingInlineStart: 18 }}>
            {seg.items.map((l, i) => (
              <li key={i} className="text-[13px] text-gray-700 list-decimal">{l.replace(/^\d+\.\s+/, '')}</li>
            ))}
          </ol>
        )
        return (
          <p key={si} className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
            {seg.items.join('\n')}
          </p>
        )
      })}
      {hasMore && <p className="text-[11px] text-gray-400">...</p>}
    </div>
  )
}

// ── Pull-to-refresh indicator ─────────────────────────────

function RefreshIndicator({ pullY, refreshing }: { pullY: number; refreshing: boolean }) {
  const visible = pullY > 8 || refreshing
  if (!visible) return null
  const spin = refreshing || pullY > 48
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 z-10 pointer-events-none"
         style={{ transform: `translateY(${Math.min(pullY, 52)}px)`, transition: refreshing ? 'none' : 'transform 0.1s' }}>
      <div className={cn('w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center',
        spin && 'animate-spin')}>
        <span className="text-[14px]">↻</span>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────

export default function Features() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [tab,      setTab]     = useState<'tasks' | 'diary' | 'groups'>('tasks')
  const [tasks,    setTasks]   = useState<Task[]>([])
  const [entries,  setEntries] = useState<DiaryEntry[]>([])
  const [loading,  setLoading] = useState(true)

  // Tasks state
  const [taskInput, setTaskInput] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  // Diary state
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryTitle,   setDiaryTitle]   = useState('')
  const [diaryFormat,  setDiaryFormat]  = useState<'text' | 'bullets' | 'numbered'>('text')
  const [savingDiary,  setSavingDiary]  = useState(false)
  const [showForm,     setShowForm]     = useState(false)

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver,  setDragOver]  = useState<string | null>(null)
  const dragItemRef = useRef<string | null>(null)

  const pendingTasks   = tasks.filter(t => !t.isCompleted)
  const completedTasks = tasks.filter(t => t.isCompleted)

  // ── Load data
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [tr, dr] = await Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/diary').then(r => r.json()),
    ])
    setTasks(tr.tasks ?? [])
    setEntries(dr.entries ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Pull-to-refresh
  const { scrollRef, pullY, refreshing } = usePullToRefresh(loadAll)

  // ── Add task
  const addTask = async () => {
    if (!taskInput.trim() || savingTask) return
    setSavingTask(true)
    const res  = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskInput.trim() }),
    })
    const data = await res.json()
    setTasks(prev => [data.task, ...prev])
    setTaskInput('')
    setSavingTask(false)
  }

  // ── Toggle complete
  const toggleComplete = async (task: Task) => {
    const v = !task.isCompleted
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: v, completedAt: v ? new Date().toISOString() : null } : t))
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: v }),
    })
  }

  // ── Delete task
  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  // ── Reorder
  const reorderTimer = useRef<NodeJS.Timeout>()
  const saveOrder = (newOrder: Task[]) => {
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(() => {
      fetch('/api/tasks/reorder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder.filter(t => !t.isCompleted).map(t => t.id) }),
      })
    }, 600)
  }

  const onTouchStart = (e: React.TouchEvent, id: string) => {
    dragItemRef.current = id; setDragging(id)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragItemRef.current) return
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const row = el?.closest('[data-task-id]') as HTMLElement | null
    if (row) { const oid = row.getAttribute('data-task-id'); if (oid && oid !== dragItemRef.current) setDragOver(oid) }
  }
  const onTouchEnd = () => {
    if (dragItemRef.current && dragOver && dragOver !== dragItemRef.current) {
      setTasks(prev => {
        const pending = prev.filter(t => !t.isCompleted)
        const done    = prev.filter(t => t.isCompleted)
        const fi = pending.findIndex(t => t.id === dragItemRef.current)
        const ti = pending.findIndex(t => t.id === dragOver)
        if (fi === -1 || ti === -1) return prev
        const reordered = [...pending]
        const [moved] = reordered.splice(fi, 1)
        reordered.splice(ti, 0, moved)
        const updated = reordered.map((t, i) => ({ ...t, sortOrder: i }))
        saveOrder(updated)
        return [...updated, ...done]
      })
    }
    setDragging(null); setDragOver(null); dragItemRef.current = null
  }

  // ── Save diary entry
  const saveDiary = async () => {
    if (!diaryContent.trim() || savingDiary) return
    setSavingDiary(true)
    const res  = await fetch('/api/diary', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: diaryContent.trim(), customTitle: diaryTitle.trim() || null, format: diaryFormat }),
    })
    const data = await res.json()
    setEntries(prev => [data.entry, ...prev])
    setDiaryContent(''); setDiaryTitle(''); setDiaryFormat('text'); setShowForm(false)
    setSavingDiary(false)
  }

  // ── Delete diary entry
  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    await fetch(`/api/diary/${id}`, { method: 'DELETE' })
  }

  // ── Format change — appends a new list item, never reformats existing text
  const handleFormatChange = (fmt: 'text' | 'bullets' | 'numbered') => {
    if (fmt === diaryFormat) return
    setDiaryFormat(fmt)
    if (fmt === 'text') return
    const c = diaryContent
    if (!c.trim()) {
      setDiaryContent(fmt === 'bullets' ? '• ' : '1. ')
      return
    }
    const sep = c.endsWith('\n') ? '' : '\n'
    if (fmt === 'bullets') {
      setDiaryContent(c + sep + '• ')
    } else {
      const n = (c.match(/^\d+\./gm) ?? []).length + 1
      setDiaryContent(c + sep + `${n}. `)
    }
  }

  // ── Auto-continue list on Enter key
  const handleDiaryKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return
    const lines = diaryContent.split('\n')
    const last  = lines[lines.length - 1]
    if (diaryFormat === 'bullets') {
      const m = last.match(/^[•\-]\s/)
      if (m) {
        e.preventDefault()
        if (!last.replace(/^[•\-]\s+/, '').trim()) {
          setDiaryContent(lines.slice(0, -1).join('\n'))
        } else {
          setDiaryContent(prev => prev + '\n• ')
        }
      }
    } else if (diaryFormat === 'numbered') {
      const m = last.match(/^(\d+)\.\s/)
      if (m) {
        e.preventDefault()
        if (!last.slice(m[0].length).trim()) {
          setDiaryContent(lines.slice(0, -1).join('\n'))
        } else {
          setDiaryContent(prev => prev + `\n${parseInt(m[1]) + 1}. `)
        }
      }
    }
  }


  return (
    <div dir={dir} className="flex flex-col h-full bg-gray-50 relative overflow-hidden">

      <RefreshIndicator pullY={pullY} refreshing={refreshing}/>

      {/* Header */}
      <div className={cn('px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0', dir === 'rtl' && 'flex-row-reverse')}>
        <h1 className="text-[19px] font-bold text-gray-900">{t.title}</h1>
        {tab === 'diary' && (
          <button onClick={() => setShowForm(s => !s)}
            className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[20px] transition-all',
              showForm ? 'bg-gray-200 text-gray-600' : 'bg-emerald-600 text-white')}>
            {showForm ? '×' : '+'}
          </button>
        )}
      </div>

      {/* Tab pills */}
      <div className={cn('flex gap-2 px-4 mb-2 flex-shrink-0', dir === 'rtl' && 'flex-row-reverse')}>
        {(['tasks', 'diary', 'groups'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => { setTab(tabKey); if (tabKey !== 'diary') setShowForm(false) }}
            className={cn('px-4 py-[7px] rounded-full text-[12px] font-semibold border transition-all',
              tab === tabKey ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200')}>
            {t[`${tabKey}Tab` as keyof typeof t]}
          </button>
        ))}
      </div>

      {/* ── TASKS ── */}
      {tab === 'tasks' && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-6">
          <div className={cn('mx-4 mb-3 flex gap-2 pt-1', dir === 'rtl' && 'flex-row-reverse')}>
            <input value={taskInput} onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder={t.addTaskPh} dir={dir}
              className="flex-1 h-[42px] rounded-[12px] border border-gray-200 bg-white px-3 text-[13px] focus:outline-none focus:border-emerald-400"/>
            <button onClick={addTask} disabled={!taskInput.trim() || savingTask}
              className="h-[42px] px-4 rounded-[12px] bg-emerald-600 text-white text-[13px] font-semibold disabled:opacity-40">
              {savingTask ? '...' : t.add}
            </button>
          </div>

          <div className="px-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-[52px] bg-gray-100 rounded-[12px] animate-pulse"/>)}</div>
            ) : (
              <>
                {pendingTasks.length > 0 && (
                  <div className="mb-4">
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal text-[11px]')}>{t.pending}</p>
                    <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
                      {pendingTasks.map((task, idx) => (
                        <div key={task.id} data-task-id={task.id}
                          onTouchStart={e => onTouchStart(e, task.id)}
                          onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                          className={cn('flex items-center gap-3 px-3 py-[13px] select-none transition-all',
                            idx < pendingTasks.length - 1 && 'border-b border-gray-100',
                            dragging === task.id && 'opacity-40 bg-emerald-50',
                            dragOver  === task.id && 'border-t-2 border-emerald-400',
                            dir === 'rtl' && 'flex-row-reverse')}>
                          <div className="text-gray-300 text-[16px] cursor-grab touch-none flex-shrink-0 px-1">⠿</div>
                          <button onClick={() => toggleComplete(task)}
                            className="w-[22px] h-[22px] rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0"/>
                          <span className={cn('flex-1 text-[14px] text-gray-800', dir === 'rtl' && 'text-right')}>{task.title}</span>
                          <button onClick={() => deleteTask(task.id)} className="text-gray-300 text-[18px] flex-shrink-0 px-1 active:text-red-400">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pendingTasks.length === 0 && completedTasks.length === 0 && (
                  <p className="text-center text-[13px] text-gray-400 mt-10">{t.noTasks}</p>
                )}
                {completedTasks.length > 0 && (
                  <div>
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal text-[11px]')}>{t.done}</p>
                    <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
                      {completedTasks.map((task, idx) => (
                        <div key={task.id}
                          className={cn('flex items-center gap-3 px-3 py-[13px]',
                            idx < completedTasks.length - 1 && 'border-b border-gray-100',
                            dir === 'rtl' && 'flex-row-reverse')}>
                          <div className="w-[24px] flex-shrink-0"/>
                          <button onClick={() => toggleComplete(task)}
                            className="w-[22px] h-[22px] rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[11px] font-bold">✓</span>
                          </button>
                          <span className={cn('flex-1 text-[14px] text-gray-400 line-through', dir === 'rtl' && 'text-right')}>{task.title}</span>
                          <button onClick={() => deleteTask(task.id)} className="text-gray-300 text-[18px] flex-shrink-0 px-1 active:text-red-400">×</button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 text-center">🗂 {t.archiveNote}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── DIARY ── */}
      {tab === 'diary' && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Entry form — slides in when showForm=true */}
          {showForm && (
            <div className="mx-4 mb-3 bg-white border border-gray-200 rounded-[14px] p-4 flex-shrink-0">
              {/* Format toolbar */}
              <div className={cn('flex gap-2 mb-3', dir === 'rtl' && 'flex-row-reverse')}>
                {(['text', 'bullets', 'numbered'] as const).map(fmt => (
                  <button key={fmt} onClick={() => handleFormatChange(fmt)}
                    className={cn('px-3 py-[5px] rounded-[8px] text-[13px] font-bold border transition-all',
                      diaryFormat === fmt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-500 border-gray-200')}>
                    {fmt === 'text' ? t.fmtText : fmt === 'bullets' ? t.fmtBullets : t.fmtNumbered}
                  </button>
                ))}
                <div className="flex-1"/>
              </div>

              {/* Optional title */}
              <input value={diaryTitle} onChange={e => setDiaryTitle(e.target.value)}
                placeholder={t.diaryTitlePh} dir={dir}
                className="w-full h-[36px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400 mb-2"/>

              {/* Content */}
              <textarea value={diaryContent} onChange={e => setDiaryContent(e.target.value)}
                onKeyDown={handleDiaryKeyDown}
                placeholder={diaryFormat === 'bullets' ? `• ${t.diaryPh}` : diaryFormat === 'numbered' ? `1. ${t.diaryPh}` : t.diaryPh}
                dir={dir} rows={4}
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] focus:outline-none focus:border-emerald-400 resize-none leading-relaxed"/>

              {/* Save button */}
              <button onClick={saveDiary} disabled={!diaryContent.trim() || savingDiary}
                className="mt-3 w-full py-[11px] rounded-[12px] bg-emerald-600 text-white text-[13px] font-semibold disabled:opacity-40">
                {savingDiary ? '...' : t.save}
              </button>
            </div>
          )}

          {/* Entries list */}
          <div ref={!showForm ? scrollRef : undefined} className="flex-1 overflow-y-auto pb-6 px-4">
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-[80px] bg-gray-100 rounded-[14px] animate-pulse"/>)}</div>
            ) : entries.length === 0 ? (
              <p className="text-center text-[13px] text-gray-400 mt-10">{t.noEntries}</p>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <div key={entry.id} className="bg-white border border-gray-200 rounded-[14px] p-4">
                    <div className={cn('flex items-start justify-between gap-2', dir === 'rtl' && 'flex-row-reverse')}>
                      <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {formatEntryDate(entry.createdAt, lang)}
                          {entry.customTitle && <span className="text-gray-600 font-semibold"> · {entry.customTitle}</span>}
                        </p>
                        <DiaryContent content={entry.content} format={entry.format} dir={dir} preview={true}/>
                      </div>
                      <button onClick={() => deleteEntry(entry.id)}
                        className="text-gray-300 text-[18px] flex-shrink-0 active:text-red-400 mt-[-2px]">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GROUPS ── */}
      {tab === 'groups' && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-6 px-4 pt-1">
          <div className="bg-white border border-gray-200 rounded-[14px] p-5 flex flex-col items-center text-center gap-3">
            <span className="text-[40px]">👥</span>
            <p className="text-[15px] font-semibold text-gray-900">{t.groups}</p>
            <p className="text-[13px] text-gray-400 leading-relaxed max-w-[260px]">{t.groupsSub}</p>
            <button onClick={() => router.push('/groups')}
              className="mt-1 px-6 py-[11px] rounded-[12px] bg-emerald-600 text-white text-[13px] font-semibold active:opacity-80">
              {t.openGroups}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
