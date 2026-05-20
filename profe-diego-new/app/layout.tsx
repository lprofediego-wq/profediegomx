import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Profe Diego MX — Plataforma Educativa Premium',
  description: 'Prepárate y logra tu meta con los mejores cursos de admisión IPN, UNAM, Cálculo y más.',
  icons: { icon: 'https://i.ibb.co/d4m853YQ/logo-sin-letras.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#f8fafc]">
        {children}
      </body>
    </html>
  )
}
