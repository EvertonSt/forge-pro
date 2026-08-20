import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forge Pro — App',
  description: 'Checkout, account, licenses, and vendor tools for Forge Pro.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
