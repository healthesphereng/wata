import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { startSleepEvent } from '@/lib/events/factories';
import { SleepSheet } from './sleep-sheet';

const logEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/offline/local-repo', () => ({ logEvent: (...a: unknown[]) => logEvent(...a) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const selectedChild = {
  id: 'a2222222-2222-4222-8222-222222222222',
  family_id: 'a1111111-1111-4111-8111-111111111111',
  name: 'Ada',
  birth_date: null,
};
const userId = 'a3333333-3333-4333-8333-333333333333';
vi.mock('@/providers/app-data', () => ({
  useAppData: () => ({ selectedChild, userId }),
}));

// Controllable event stream per test.
let mockEvents: unknown[] = [];
vi.mock('@/hooks/use-events', () => ({ useEvents: () => ({ events: mockEvents }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mockEvents = [];
});

describe('SleepSheet', () => {
  it('starts a running sleep (ended_at null) when idle', async () => {
    const user = userEvent.setup();
    render(<SleepSheet open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /start sleep now/i }));

    expect(logEvent).toHaveBeenCalledTimes(1);
    expect(logEvent.mock.calls[0][0]).toMatchObject({ kind: 'sleep', ended_at: null });
  });

  it('shows a stop control and stops the running timer', async () => {
    const running = startSleepEvent({
      familyId: selectedChild.family_id,
      childId: selectedChild.id,
      createdBy: userId,
    });
    mockEvents = [running];

    const user = userEvent.setup();
    render(<SleepSheet open onOpenChange={vi.fn()} />);

    expect(screen.getByText(/sleeping/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /stop sleep/i }));

    expect(logEvent).toHaveBeenCalledTimes(1);
    const stopped = logEvent.mock.calls[0][0];
    expect(stopped.id).toBe(running.id);
    expect(stopped.ended_at).not.toBeNull();
  });

  it('adds a past sleep from manual times', async () => {
    const user = userEvent.setup();
    render(<SleepSheet open onOpenChange={vi.fn()} />);

    await user.clear(screen.getByLabelText('From'));
    await user.type(screen.getByLabelText('From'), '13:00');
    await user.clear(screen.getByLabelText('To'));
    await user.type(screen.getByLabelText('To'), '14:30');
    await user.click(screen.getByRole('button', { name: /^add sleep$/i }));

    expect(logEvent).toHaveBeenCalledTimes(1);
    const ev = logEvent.mock.calls[0][0];
    expect(ev.kind).toBe('sleep');
    expect(ev.ended_at).not.toBeNull();
    expect(new Date(ev.ended_at).getTime()).toBeGreaterThan(new Date(ev.started_at).getTime());
  });
});
