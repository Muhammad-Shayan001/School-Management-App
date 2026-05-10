import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/app/_components/providers/auth-provider';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SchoolMS — School Management System',
  description:
    'A modern, full-featured school management system with role-based dashboards, real-time communication, and academic management.',
  keywords: ['school management', 'education', 'dashboard', 'admin panel'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch current user on the server to hydrate auth state
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body 
        className="min-h-full flex flex-col font-sans antialiased"
        suppressHydrationWarning
      >
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
