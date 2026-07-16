import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInForm } from './sign-in-form';

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword, signUp, signInWithOAuth },
  }),
}));

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SignInForm', () => {
  it('renders email, password, and both sign-in paths', () => {
    render(<SignInForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('toggles to create-account mode', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByRole('button', { name: /create an account/i }));
    expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument();
  });

  it('signs in and navigates to /today on success', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(screen.getByLabelText(/email/i), 'parent@example.com');
    await user.type(screen.getByLabelText(/password/i), 'hunter2hunter2');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'parent@example.com',
      password: 'hunter2hunter2',
    });
    expect(push).toHaveBeenCalledWith('/today');
  });

  it('surfaces auth errors without navigating', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(screen.getByLabelText(/email/i), 'parent@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials');
    expect(push).not.toHaveBeenCalled();
  });
});
