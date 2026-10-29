import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tochi .dev Studio // Internship & Student Lifecycle Engine',
  description: 'Internal operations command center for Tochi .dev Studio internship cohorts, offer letters, certification, and verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-tochi-canvas text-tochi-text font-sans antialiased selection:bg-[#541228]/15 selection:text-[#541228]">
        {children}
      </body>
    </html>
  );
}
