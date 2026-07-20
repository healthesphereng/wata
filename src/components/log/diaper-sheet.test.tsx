import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiaperSheet } from './diaper-sheet';

const logEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/offline/local-repo', () => ({ logEvent: (...a: unknown[]) => logEvent(...a) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const selectedChild = {
  id: 'a2222222-2222-4222-8222-222222222222',
  family_id: 'a1111111-1111-4111-8111-111111111111',
  name: 'Ada',
  birth_date: null,
};
vi.mock('@/providers/app-data', () => ({
  useAppData: () => ({ selectedChild, userId: 'a3333333-3333-4333-8333-333333333333' }),
}));

beforeEach(() => vi.clearAllMocks());

describe('DiaperSheet', () => {
  it('offers the four diaper types', () => {
    render(<DiaperSheet open onOpenChange={vi.fn()} />);
    for (const label of ['Wet', 'Dirty', 'Mixed', 'Dry']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('logs the tapped type in one tap and closes', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<DiaperSheet open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /Mixed/ }));

    expect(logEvent).toHaveBeenCalledTimes(1);
    expect(logEvent.mock.calls[0][0]).toMatchObject({
      kind: 'diaper',
      child_id: selectedChild.id,
      details: { contents: 'mixed' },
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
