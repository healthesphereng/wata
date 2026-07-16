'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'sign-in' | 'sign-up';

/**
 * Email+password with a create-account toggle, plus Google OAuth.
 * Big targets, one primary action, no surprises — sign-in happens once,
 * usually with a baby on one arm.
 */
export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setPending(false);
        return;
      }
      router.push('/today');
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setPending(false);
        return;
      }
      if (data.session) {
        router.push('/today');
        router.refresh();
      } else {
        // Email confirmation is enabled in Supabase — the session arrives
        // after they tap the link in their inbox.
        setNotice('Check your email for a confirmation link, then come back and sign in.');
        setPending(false);
      }
    }
  }

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setPending(false);
    }
    // On success the browser navigates away to Google.
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4" aria-busy={pending}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12 text-base"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-md bg-primary/10 p-3 text-sm text-foreground">
          {notice}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending ? 'One moment…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={signInWithGoogle}
        className="h-12 w-full text-base"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="mr-2 size-5">
          <path
            fill="currentColor"
            d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.9-5.35 3.9a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.15-2.15A8.86 8.86 0 0 0 12 3.1a8.9 8.9 0 1 0 0 17.8c5.15 0 8.85-3.6 8.85-8.7 0-.4-.05-.75-.1-1.1Z"
          />
        </svg>
        Continue with Google
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          setError(null);
          setNotice(null);
        }}
        className="min-h-11 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {mode === 'sign-in' ? 'New here? Create an account' : 'Have an account? Sign in'}
      </button>
    </form>
  );
}
