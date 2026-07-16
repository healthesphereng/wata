import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/auth/sign-out-button';

export const metadata = { title: 'Today — Wata' };

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      <p className="text-center text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user?.email}</span>
      </p>
      <p className="max-w-xs text-center text-xs text-muted-foreground/60">
        The feed, sleep, and diaper trackers land here next — big buttons, thumb height.
      </p>
      <SignOutButton />
    </main>
  );
}
