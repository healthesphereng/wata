import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppDataProvider } from '@/providers/app-data';
import { ChildSwitcher } from '@/components/app/child-switcher';
import { ThumbBar } from '@/components/app/thumb-bar';
import { SignOutButton } from '@/components/auth/sign-out-button';

/**
 * Authed shell: server-checks the session (defense in depth over the proxy),
 * then wraps the app in the data provider with a header (child switcher +
 * sign-out) and the fixed bottom thumb bar.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <AppDataProvider userId={user.id}>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <ChildSwitcher />
          <SignOutButton />
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <ThumbBar />
      </div>
    </AppDataProvider>
  );
}
