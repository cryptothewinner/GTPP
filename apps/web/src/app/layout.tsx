import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';

import { ShellGate } from '@/components/layout/shell-gate';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'SepeNatural 2026',
    description: 'Enterprise Resource Planning',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <QueryProvider>
                    <AuthProvider>
                        <ShellGate>{children}</ShellGate>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
