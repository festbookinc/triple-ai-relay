import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { topic, draft, criticism } = await req.json()
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const prompt = `다음 주제에 대해 초안과 비판을 모두 검토한 후, 균형 잡힌 최종 결론을 도출해 주세요.

주제: ${topic}

[초안]
${draft}

[비판]
${criticism}

위 내용을 종합하여 비판을 반영한 개선된 최종 결론을 작성해 주세요.`
  const res = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt })
  return Response.json({ content: res.text ?? '' })
}
