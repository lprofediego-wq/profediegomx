import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Profe Diego MX — Plataforma Educativa Premium',
  description: 'Prepárate y logra tu meta con los mejores cursos de admisión IPN, UNAM, Cálculo y más.',
  icons: { icon: 'https://i.ibb.co/d4m853YQ/logo-sin-letras.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased bg-[#f8fafc]`}>
        {children}
      </body>
    </html>
  )
}
