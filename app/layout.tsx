import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stem Splitter - AI-Powered Audio Stem Separation',
  description: 'Professional audio stem separation powered by AI. Isolate vocals, drums, bass, guitar, and piano from any audio track. Fast, accurate, and easy to use.',
  keywords: 'stem splitter, audio separation, vocal isolation, music stems, AI audio, track separation, music production',
  authors: [{ name: 'Stem Splitter' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stemsplitter.com',
    title: 'Stem Splitter - AI-Powered Audio Stem Separation',
    description: 'Professional audio stem separation powered by AI. Isolate vocals, drums, bass, guitar, and piano from any audio track.',
    siteName: 'Stem Splitter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stem Splitter - AI-Powered Audio Stem Separation',
    description: 'Professional audio stem separation powered by AI.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}





