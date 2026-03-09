import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Checkers — Neon Edition',
  description:
    'A neon-themed browser Checkers game with an AI opponent, difficulty levels, and smooth animations. Built with Next.js, TypeScript, and Tailwind CSS.',
  keywords: ['checkers', 'draughts', 'board game', 'AI', 'nextjs'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA / mobile meta */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#06060f" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className={`${geist.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
