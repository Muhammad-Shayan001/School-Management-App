import { NextResponse } from 'next/server';
import { createClient } from '@/app/_lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // if "next" is in searchParams, use it as the redirect path
  // otherwise, default to /dashboard or in our case /
  let next = searchParams.get('redirect_to') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Forward the user to the specified redirect path (e.g. /reset-password)
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // Handle error gracefully
      return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20token`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Invalid%20request`);
}
