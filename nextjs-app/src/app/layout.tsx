import './globals.css'
import { Inter } from 'next/font/google'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'AI Compliance Tool - AI Governance Hub',
    description: 'Multi-framework AI governance assessment tool',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-50 min-h-screen`}>
                <Header />
                <main className="pb-8">
                    {children}
                </main>
            </body>
        </html>
    )
}
