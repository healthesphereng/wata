'use client';

import { useState } from 'react';
import { useAppData } from '@/providers/app-data';
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    try {
      await addChild(name, birthDate || null);
      setName('');
      setBirthDate('');
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
