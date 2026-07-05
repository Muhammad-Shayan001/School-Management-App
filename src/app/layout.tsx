import type { Metadata } from 'next';
import { AuthProvider } from '@/app/_components/providers/auth-provider';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { Toaster } from 'sonner';
import { Montserrat } from 'next/font/google';
import FcmHandler from '@/app/_components/layout/FcmHandler';
import { InstitutionProvider } from '@/app/_lib/context/InstitutionContext';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Skolic — Smart School Management System',
  description:
    'Skolic is a modern, full-featured school management system with role-based dashboards, real-time communication, and academic management.',
  keywords: ['school management', 'education', 'dashboard', 'admin panel', 'Skolic'],
  icons: {
    icon: '/images/Skolic app icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Parallel fetch for initial user state
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`h-full scroll-smooth ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body 
        className="min-h-full flex flex-col font-sans antialiased text-text-primary bg-bg-primary selection:bg-accent/10 selection:text-accent"
        suppressHydrationWarning
      >
        <AuthProvider initialUser={user}>
          <InstitutionProvider>
            {children}
            <FcmHandler />
            <Toaster position="top-right" richColors closeButton />
          </InstitutionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
