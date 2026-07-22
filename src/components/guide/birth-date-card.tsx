'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * The coach can't say anything without an age. Shown when the selected child
 * has no birth_date (it's optional at add time) — one field, one save.
 */
export function BirthDateCard({ childId, childName }: { childId: string; childName: string }) {
  const { updateChild } = useAppData();
  const [date, setDate] = useState('');
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setPending(true);
    try {
      await updateChild(childId, { birth_date: date });
      toast.success('Birth date saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the birth date.');
      setPending(false);
    }
  }

  return (
    <section
      aria-label="Add birth date"
      className="shadow-soft flex flex-col gap-4 rounded-2xl bg-card p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <CalendarDays className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold">When was {childName} born?</h3>
          <p className="text-sm text-muted-foreground">
            The coach uses age for feeding stages and vaccine dates.
          </p>
        </div>
      </div>
      <form onSubmit={save} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="guide-birth-date">Birth date</Label>
          <Input
            id="guide-birth-date"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <Button type="submit" disabled={pending || !date} className="h-12 text-base">
          {pending ? 'Saving…' : 'Unlock the coach'}
        </Button>
      </form>
    </section>
  );
}
