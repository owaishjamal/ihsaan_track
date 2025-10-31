import './globals.css';
import Toaster from '@/components/Toaster';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: "IhsaanTrack",
  description: "Realtime daily deen tracking for your family or group",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full font-sans antialiased" style={{ fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}