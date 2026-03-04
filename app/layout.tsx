import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Triple AI Relay',
  description: 'Claude → GPT → Gemini 3단계 AI 릴레이',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-white">{children}</body>
    </html>
  )
}
