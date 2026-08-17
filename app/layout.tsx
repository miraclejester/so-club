import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AppNav } from '@/components/AppNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang="en" className={cn('font-sans', inter.variable)}>
            <body className="min-h-full flex flex-col">
                <AppNav />
                {children}
            </body>
        </html>
    );
}
