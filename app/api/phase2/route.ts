import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { topic, draft } = await req.json()
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: '당신은 냉철한 비평가입니다. 주어진 글의 논리적 허점, 모순, 근거 부족, 반례 등을 무자비하게 지적하세요. 감정 없이 오직 논리적 결함만 분석하세요.' },
      { role: 'user', content: `주제: ${topic}\n\n아래 초안을 비판해 주세요:\n\n${draft}` },
    ],
  })
  return Response.json({ content: res.choices[0].message.content ?? '' })
}
