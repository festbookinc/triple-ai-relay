'use client'
import { useState } from 'react'

type Status = 'idle' | 'loading' | 'done' | 'error'

interface Phase {
  status: Status
  content: string
}

const PHASES = [
  { label: 'Phase 1 — Maker', model: 'claude-sonnet-4-6', accent: 'border-orange-400', badge: 'bg-orange-900 text-orange-300' },
  { label: 'Phase 2 — Checker', model: 'gpt-4o', accent: 'border-green-400', badge: 'bg-green-900 text-green-300' },
  { label: 'Phase 3 — Finisher', model: 'gemini-2.5-pro', accent: 'border-blue-400', badge: 'bg-blue-900 text-blue-300' },
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

  const run = async () => {
    if (!topic.trim() || running) return
    setRunning(true)
    setPhases([
      { status: 'idle', content: '' },
      { status: 'idle', content: '' },
      { status: 'idle', content: '' },
    ])

    try {
      const res = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = JSON.parse(line.slice(6))
          if (data.error) { update(2, { status: 'error', content: data.error }); break }
          if (data.done) break
          if (data.phase) update(data.phase - 1, { status: data.status, content: data.content ?? '' })
        }
      }
    } catch (e) {
      update(0, { status: 'error', content: String(e) })
    }

    setRunning(false)
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Triple AI Relay</h1>
          <p className="text-gray-400">Claude <span className="text-orange-400">Maker</span> → GPT <span className="text-green-400">Checker</span> → Gemini <span className="text-blue-400">Finisher</span></p>
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-8 max-w-3xl mx-auto">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-base focus:outline-none focus:border-blue-500 placeholder-gray-500 disabled:opacity-50"
            placeholder="분석할 주제를 입력하세요..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            disabled={running}
          />
          <button
            className="px-7 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl font-semibold transition-colors"
            onClick={run}
            disabled={running || !topic.trim()}
          >
            {running ? '분석 중…' : '분석 시작'}
          </button>
        </div>

        {/* Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PHASES.map((info, i) => (
            <div key={i} className={`bg-gray-900 border-t-4 ${info.accent} rounded-2xl p-5 min-h-64 flex flex-col`}>
              <div className="mb-4">
                <h2 className="font-bold text-lg">{info.label}</h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${info.badge}`}>{info.model}</span>
              </div>

              {phases[i].status === 'idle' && (
                <p className="text-gray-600 text-sm mt-auto">대기 중…</p>
              )}
              {phases[i].status === 'loading' && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm mt-2">
                  <span className="animate-pulse">●</span> 생성 중…
                </div>
              )}
              {phases[i].status === 'done' && (
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {phases[i].content}
                </p>
              )}
              {phases[i].status === 'error' && (
                <p className="text-red-400 text-sm whitespace-pre-wrap">{phases[i].content}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
