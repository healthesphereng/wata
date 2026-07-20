'use client';

import { Plus, Check } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { AddChildDialog } from './add-child-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Header control: shows the current baby and switches between them. Hidden
 * until there's at least one child (onboarding handles the empty case).
 */
export function ChildSwitcher() {
  const { children, selectedChild, selectChild } = useAppData();

  if (children.length === 0) return null;

  if (children.length === 1 && selectedChild) {
    return <span className="text-base font-semibold">{selectedChild.name}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedChild?.id} onValueChange={(v) => v && selectChild(v)}>
        <SelectTrigger className="h-10 min-w-32 border-none bg-transparent text-base font-semibold shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {children.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <span className="flex items-center gap-2">
                {c.id === selectedChild?.id && <Check className="size-4" aria-hidden />}
                {c.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AddChildDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label="Add another baby" className="size-10">
            <Plus className="size-5" />
          </Button>
        }
      />
    </div>
  );
}
