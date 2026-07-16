import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Authed shell. Middleware already guards these routes; this server-side
 * check is defense in depth (and gives children a guaranteed user).
 * The bottom thumb bar arrives with the trackers.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return <div className="flex min-h-dvh flex-col bg-background text-foreground">{children}</div>;
}
