import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { AuthProvider } from '@/app/_components/providers/auth-provider';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
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
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full scroll-smooth`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body 
        className="min-h-full flex flex-col font-sans antialiased text-text-primary bg-bg-primary selection:bg-accent/10 selection:text-accent"
        suppressHydrationWarning
      >
        <AuthProvider initialUser={user}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
