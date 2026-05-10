import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { DASHBOARD_ROUTES, ROLES } from '@/app/_lib/utils/constants';

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session
  let user = null;
  
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // If there's an auth error like invalid refresh token, we can simply clear the user
    user = null;
  } else {
    user = data.user;
  }

  const pathname = request.nextUrl.pathname;

  // Bypass proxy protections for specific API routes
  if (pathname.startsWith('/api/auth/callback')) {
    return supabaseResponse;
  }

  // Get role and status from metadata if available (faster than DB query)
  let role = user?.user_metadata?.role;
  let status = user?.user_metadata?.status;

  // If metadata is missing (legacy users or first time), fetch from DB once
  if (user && (!role || !status)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      role = profile.role;
      status = profile.status;
    }
  }

  // Define protected route prefixes
  const dashboardPrefixes = ['/super-admin', '/admin', '/teacher', '/student'];
  const isDashboardRoute = dashboardPrefixes.some((p) => pathname.startsWith(p));
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/pending') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

  // Redirect unauthenticated users from dashboard to login
  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    if (status === 'pending' && pathname === '/pending') {
      return supabaseResponse;
    }

    if (status === 'approved') {
      const dashRoute = DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES] || '/';
      const url = request.nextUrl.clone();
      url.pathname = dashRoute;
      return NextResponse.redirect(url);
    }
  }

  // Role-based route protection
  if (isDashboardRoute && user) {
    if (status !== 'approved') {
      const url = request.nextUrl.clone();
      url.pathname = '/pending';
      return NextResponse.redirect(url);
    }

    const roleRouteMap: Record<string, string> = {
      '/super-admin': ROLES.SUPER_ADMIN,
      '/admin': ROLES.ADMIN,
      '/teacher': ROLES.TEACHER,
      '/student': ROLES.STUDENT,
    };

    for (const [prefix, requiredRole] of Object.entries(roleRouteMap)) {
      if (pathname.startsWith(prefix) && role !== requiredRole) {
        const dashRoute = DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES] || '/';
        const url = request.nextUrl.clone();
        url.pathname = dashRoute;
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

// Map the middleware function to the expected export name if needed
export { middleware as proxy };

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
