import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth + email-confirmation landing: exchanges the one-time code in the
 * URL for a session cookie, then sends the user into the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/today`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth`);
}
