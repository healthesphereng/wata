import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedForm } from './feed-sheet';

const logEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/offline/local-repo', () => ({ logEvent: (...a: unknown[]) => logEvent(...a) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const props = {
  childId: 'a2222222-2222-4222-8222-222222222222',
  familyId: 'a1111111-1111-4111-8111-111111111111',
  userId: 'a3333333-3333-4333-8333-333333333333',
  onDone: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('FeedForm', () => {
  it('renders the three feed methods and seeds the breast default', () => {
    render(<FeedForm {...props} defaults={{ method: 'breast', side: 'right' }} />);
    expect(screen.getByRole('button', { name: 'Breast' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Bottle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pump' })).toBeInTheDocument();
    // right side seeded from defaults
    expect(screen.getByRole('button', { name: 'Right' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the ml stepper for bottle and logs the event on save', async () => {
    const user = userEvent.setup();
    render(<FeedForm {...props} defaults={{ method: 'bottle', amount_ml: 100 }} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More' }));
    expect(screen.getByText('110')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save feed/i }));

    expect(logEvent).toHaveBeenCalledTimes(1);
    const logged = logEvent.mock.calls[0][0];
    expect(logged).toMatchObject({
      kind: 'feed',
      child_id: props.childId,
      details: { method: 'bottle', amount_ml: 110 },
    });
    expect(props.onDone).toHaveBeenCalled();
  });

  it('switches to breast and logs a side, not an amount', async () => {
    const user = userEvent.setup();
    render(<FeedForm {...props} defaults={{ method: 'bottle', amount_ml: 100 }} />);
    await user.click(screen.getByRole('button', { name: 'Breast' }));
    await user.click(screen.getByRole('button', { name: 'Both' }));
    await user.click(screen.getByRole('button', { name: /save feed/i }));

    expect(logEvent.mock.calls[0][0].details).toEqual({ method: 'breast', side: 'both' });
  });
});
