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
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
