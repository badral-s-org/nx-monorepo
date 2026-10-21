import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './global.css';

export const metadata: Metadata = {
  title: 'Secret Manager',
  description: 'Manage application secrets',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Toaster richColors position="top-right" />

        {children}
      </body>
    </html>
  );
}
