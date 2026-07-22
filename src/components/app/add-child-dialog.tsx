'use client';

import { useState } from 'react';
import { useAppData, type Child } from '@/providers/app-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Add a baby. Doubles as first-run onboarding (rendered inline on /today when
 * there are no children) and as the "+ Add" entry in the child switcher.
 */
export function AddChildDialog({ trigger }: { trigger: React.ReactElement }) {
  const { addChild } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Child['sex']>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    try {
      await addChild(name, birthDate || null, sex);
      setName('');
      setBirthDate('');
      setSex(null);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add your baby.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your baby</DialogTitle>
          <DialogDescription>Just a name to start — you can add the rest later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="child-name">Name</Label>
            <Input
              id="child-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Baby's name"
              autoFocus
              required
              className="h-12 text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label id="child-sex-label">Sex (optional — sharpens the coach&apos;s numbers)</Label>
            <div role="group" aria-labelledby="child-sex-label" className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'female', label: 'Girl', active: 'bg-pink/50 border-pink-deep/50' },
                  { value: 'male', label: 'Boy', active: 'bg-blue-soft/50 border-blue-soft' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={sex === opt.value}
                  onClick={() => setSex(sex === opt.value ? null : opt.value)}
                  className={cn(
                    'h-12 rounded-full border border-transparent text-base font-semibold transition-colors',
                    sex === opt.value ? opt.active : 'bg-secondary text-foreground hover:bg-accent'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="child-dob">Birth date (optional)</Label>
            <Input
              id="child-dob"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending || !name.trim()} className="h-12 text-base">
            {pending ? 'Adding…' : 'Add baby'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
