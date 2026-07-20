import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDiaperEvent, createFeedEvent } from '@/lib/events/factories';
import { EditEventSheet } from './edit-event-sheet';

const logEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/offline/local-repo', () => ({ logEvent: (...a: unknown[]) => logEvent(...a) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ctx = {
  familyId: 'a1111111-1111-4111-8111-111111111111',
  childId: 'a2222222-2222-4222-8222-222222222222',
  createdBy: 'a3333333-3333-4333-8333-333333333333',
};

beforeEach(() => vi.clearAllMocks());

describe('EditEventSheet', () => {
  it('edits a feed amount and saves a bumped revision', async () => {
    const feed = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 100 } });
    const user = userEvent.setup();
    render(<EditEventSheet event={feed} onOpenChange={vi.fn()} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(logEvent).toHaveBeenCalledTimes(1);
    const saved = logEvent.mock.calls[0][0];
    expect(saved.id).toBe(feed.id);
    expect(saved.details.amount_ml).toBe(110);
    expect(saved.deleted_at).toBeNull();
  });

  it('soft-deletes an event', async () => {
    const diaper = createDiaperEvent({ ...ctx, details: { contents: 'wet' } });
    const user = userEvent.setup();
    render(<EditEventSheet event={diaper} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(logEvent).toHaveBeenCalledTimes(1);
    const deleted = logEvent.mock.calls[0][0];
    expect(deleted.id).toBe(diaper.id);
    expect(deleted.deleted_at).not.toBeNull();
  });
});
