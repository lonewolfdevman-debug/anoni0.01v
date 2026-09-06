import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Anoni — Be Yourself. Or Don\'t.',
  description: 'An anonymous social platform where identity is optional.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg-base text-text-primary min-h-screen`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#14141f',
              color: '#fff',
              border: '1px solid #1e1e32',
            },
          }}
        />
      </body>
    </html>
  )
}
