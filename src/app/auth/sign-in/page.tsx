import { SignInForm } from '@/components/auth/sign-in-form';
import { PastelBlobs } from '@/components/ui/pastel-blobs';

export const metadata = { title: 'Sign in — Wata' };

export default function SignInPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center bg-background p-6 text-foreground">
      <PastelBlobs />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            w
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome to wata</h1>
          <p className="text-center text-sm text-muted-foreground">
            Feeds, sleep, and diapers — logged one-handed.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
