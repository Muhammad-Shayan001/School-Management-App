import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { DASHBOARD_ROUTES, ROLES } from '@/app/_lib/utils/constants';

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always refresh session — CRITICAL for Supabase SSR
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Always bypass for API and static routes
  if (pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // --- Determine role & status ---
  let role: string | undefined = user?.user_metadata?.role;
  let status: string | undefined = user?.user_metadata?.status;

  // Fallback: fetch from DB if metadata is missing
  // Only do this for protected routes (avoid on every public page)
  const dashboardPrefixes = ['/super-admin', '/admin', '/teacher', '/student', '/profile'];
  const isDashboardRoute = dashboardPrefixes.some((p) => pathname.startsWith(p));

  if (user && (!role || !status) && isDashboardRoute) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (profile) {
        role = profile.role;
        status = profile.status;
      }
    } catch {
      // If DB fetch fails, just pass through — don't loop
    }
  }

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/pending' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  // --- Rule 1: No user on a dashboard route → go to login ---
  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // --- Rule 2: Logged-in user on an auth page ---
  if (isAuthRoute && user) {
    // Allow /pending page if status is pending
    if (pathname === '/pending' && status === 'pending') {
      return supabaseResponse;
    }

    // Only redirect away from auth if we have a known role + approved status
    if (role && status === 'approved' && DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES]) {
      const dashRoute = DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES];
      const url = request.nextUrl.clone();
      url.pathname = dashRoute;
      return NextResponse.redirect(url);
    }

    // If role is unknown or status not approved, let them see the auth page
    return supabaseResponse;
  }

  // --- Rule 3: Dashboard route protection ---
  if (isDashboardRoute && user) {
    // If status is not approved, send to pending page
    if (status && status !== 'approved') {
      const url = request.nextUrl.clone();
      url.pathname = '/pending';
      return NextResponse.redirect(url);
    }

    // Profile/setup routes are accessible to any logged-in user
    if (pathname.startsWith('/profile')) {
      return supabaseResponse;
    }

    // Role-based protection — only if we know the role
    if (role) {
      const roleRouteMap: Record<string, string> = {
        '/super-admin': ROLES.SUPER_ADMIN,
        '/admin': ROLES.ADMIN,
        '/teacher': ROLES.TEACHER,
        '/student': ROLES.STUDENT,
      };

      for (const [prefix, requiredRole] of Object.entries(roleRouteMap)) {
        if (pathname.startsWith(prefix) && role !== requiredRole) {
          const dashRoute = DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES];
          if (dashRoute) {
            const url = request.nextUrl.clone();
            url.pathname = dashRoute;
            return NextResponse.redirect(url);
          }
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
