import { redirect } from 'next/navigation';

// Middleware routes "/" by session: signed-in → /today, signed-out → /auth/sign-in.
// This redirect only exists for completeness if middleware is ever bypassed.
export default function Home() {
  redirect('/today');
}
