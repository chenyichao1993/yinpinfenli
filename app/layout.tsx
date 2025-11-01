import type { Metadata } from 'next';
import './globals.css';
import Analytics from '@/components/Analytics';

export const metadata: Metadata = {
  title: 'Stem Splitter - AI-Powered Audio Stem Separation',
  description: 'Professional audio stem separation powered by AI. Isolate vocals, drums, bass, guitar, and piano from any audio track. Fast, accurate, and easy to use.',
  keywords: 'stem splitter, audio separation, vocal isolation, music stems, AI audio, track separation, music production',
  authors: [{ name: 'Stem Splitter' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://stemsplitter.xyz',
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
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}







