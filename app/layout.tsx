import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ORIGIN ?? 'http://localhost:3000'),
  title: 'memegen — Make the point',
  description: 'An ad-free meme maker built for fast sharing and private teams.',
  openGraph: {
    title: 'memegen — Make the point',
    description: 'Make the point. Then make it a meme. No ads, no watermarks.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'memegen — Make the point. Then make it a meme.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'memegen — Make the point',
    description: 'Make the point. Then make it a meme. No ads, no watermarks.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
