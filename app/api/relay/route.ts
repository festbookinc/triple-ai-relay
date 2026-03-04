import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60

async function phase1(topic: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: `다음 주제에 대해 논리적이고 체계적인 초안을 작성해 주세요:\n\n${topic}` }],
  })
  return (msg.content[0] as { text: string }).text
}

async function phase2(topic: string, draft: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: '당신은 냉철한 비평가입니다. 주어진 글의 논리적 허점, 모순, 근거 부족, 반례 등을 무자비하게 지적하세요. 감정 없이 오직 논리적 결함만 분석하세요.' },
      { role: 'user', content: `주제: ${topic}\n\n아래 초안을 비판해 주세요:\n\n${draft}` },
    ],
  })
  return res.choices[0].message.content ?? ''
}

async function phase3(topic: string, draft: string, criticism: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const prompt = `다음 주제에 대해 초안과 비판을 모두 검토한 후, 균형 잡힌 최종 결론을 도출해 주세요.

주제: ${topic}

[초안]
${draft}

[비판]
${criticism}

위 내용을 종합하여 비판을 반영한 개선된 최종 결론을 작성해 주세요.`
  const res = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt })
  return res.text ?? ''
}

export async function POST(req: NextRequest) {
  const { topic } = await req.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        send({ phase: 1, status: 'loading' })
        const draft = await phase1(topic)
        send({ phase: 1, status: 'done', content: draft })

        send({ phase: 2, status: 'loading' })
        const criticism = await phase2(topic, draft)
        send({ phase: 2, status: 'done', content: criticism })

        send({ phase: 3, status: 'loading' })
        const conclusion = await phase3(topic, draft, criticism)
        send({ phase: 3, status: 'done', content: conclusion })

        send({ done: true })
      } catch (err) {
        send({ error: String(err) })
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
