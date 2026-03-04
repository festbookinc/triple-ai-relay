'use client'
import { useState } from 'react'

type Status = 'idle' | 'loading' | 'done' | 'error'

interface Phase {
  status: Status
  content: string
}

const PHASES = [
  { label: 'Phase 1 — Maker', model: 'claude-sonnet-4-6', accent: 'border-l-[var(--phase-1)]', badge: 'bg-sky-100 text-sky-700' },
  { label: 'Phase 2 — Checker', model: 'gpt-4o', accent: 'border-l-[var(--phase-2)]', badge: 'bg-sky-100 text-sky-700' },
  { label: 'Phase 3 — Finisher', model: 'gemini-2.5-pro', accent: 'border-l-[var(--phase-3)]', badge: 'bg-sky-100 text-sky-700' },
]

export default function Home() {
  const [topic, setTopic] = useState('')
  const [running, setRunning] = useState(false)
  const [phases, setPhases] = useState<Phase[]>([
    { status: 'idle', content: '' },
    { status: 'idle', content: '' },
    { status: 'idle', content: '' },
  ])

  const update = (index: number, patch: Partial<Phase>) =>
    setPhases(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))

  const call = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
    return data.content as string
  }

  const run = async () => {
    if (!topic.trim() || running) return
    setRunning(true)
    setPhases([
      { status: 'idle', content: '' },
      { status: 'idle', content: '' },
      { status: 'idle', content: '' },
    ])

    try {
      update(0, { status: 'loading' })
      const draft = await call('/api/phase1', { topic })
      update(0, { status: 'done', content: draft })

      update(1, { status: 'loading' })
      const criticism = await call('/api/phase2', { topic, draft })
      update(1, { status: 'done', content: criticism })

      update(2, { status: 'loading' })
      const conclusion = await call('/api/phase3', { topic, draft, criticism })
      update(2, { status: 'done', content: conclusion })
    } catch (e) {
      const msg = String(e)
      const failedIndex = phases.findIndex(p => p.status === 'loading')
      update(failedIndex >= 0 ? failedIndex : 0, { status: 'error', content: msg })
    }

    setRunning(false)
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 tracking-tight text-[var(--text-primary)]">Triple AI Relay</h1>
          <p className="text-[var(--text-secondary)]">Claude Maker → GPT Checker → Gemini Finisher</p>
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-8 max-w-3xl mx-auto">
          <input
            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-5 py-3 text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] placeholder-[var(--text-muted)] disabled:opacity-50 transition-colors"
            placeholder="분석할 주제를 입력하세요..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            disabled={running}
          />
          <button
            className="px-8 py-3.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 text-white font-semibold text-[15px] tracking-tight shadow-[0_2px_8px_rgba(14,165,233,0.35)] hover:shadow-[0_4px_14px_rgba(14,165,233,0.4)] transition-all duration-200"
            onClick={run}
            disabled={running || !topic.trim()}
          >
            {running ? '진행 중…' : '시작하기'}
          </button>
        </div>

        {/* Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PHASES.map((info, i) => (
            <div key={i} className={`bg-[var(--bg-elevated)] border border-[var(--border)] ${info.accent} border-l-4 rounded-xl p-5 min-h-64 flex flex-col shadow-sm`}>
              <div className="mb-4">
                <h2 className="font-semibold text-[var(--text-primary)]">{info.label}</h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${info.badge}`}>{info.model}</span>
              </div>

              {phases[i].status === 'idle' && (
                <p className="text-[var(--text-muted)] text-sm mt-auto">대기 중…</p>
              )}
              {phases[i].status === 'loading' && (
                <div className="flex items-center gap-2 text-[var(--accent)] text-sm mt-2">
                  <span className="animate-pulse">●</span> 생성 중…
                </div>
              )}
              {phases[i].status === 'done' && (
                <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap leading-relaxed">
                  {phases[i].content}
                </p>
              )}
              {phases[i].status === 'error' && (
                <p className="text-red-600 text-sm whitespace-pre-wrap">{phases[i].content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--text-muted)] text-sm mt-12">
          made by 마작가
        </p>
      </div>
    </main>
  )
}
