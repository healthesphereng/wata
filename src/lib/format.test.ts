import { describe, expect, it } from 'vitest';
import { formatClock, formatDuration } from './format';

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(83 * 60_000)).toBe('1h 23m');
    expect(formatDuration(12 * 60_000)).toBe('12m');
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(-5)).toBe('0m');
  });
});

describe('formatClock', () => {
  it('formats a stopwatch clock', () => {
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(9_000)).toBe('0:09');
    expect(formatClock(3_725_000)).toBe('1:02:05');
  });
});
