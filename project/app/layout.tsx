import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mindful Coach - Meditation & Visualization',
  description: 'Transform your mind with personalized meditation and visualization coaching',
  keywords: ['meditation', 'mindfulness', 'visualization', 'wellness', 'coaching'],
  authors: [{ name: 'Mindful Coach Team' }],
  openGraph: {
    title: 'Mindful Coach - Meditation & Visualization',
    description: 'Transform your mind with personalized meditation and visualization coaching',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}