import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Token二级市场平台',
  description: 'AI模型token交易平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
