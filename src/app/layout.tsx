import type { Metadata } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fredoka',
})

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'English Class',
  description: 'Платформа для выдачи и проверки домашних заданий по английскому',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${fredoka.variable} ${nunito.variable} font-sans bg-[#F4F1FC] text-[#241B3A]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
