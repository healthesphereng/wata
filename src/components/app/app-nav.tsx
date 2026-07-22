'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/today', label: 'Today', icon: Home },
  { href: '/guide', label: 'Coach', icon: BookHeart },
] as const;

/** Header navigation between the tracker and the coach. */
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'grid size-10 place-items-center rounded-full transition-colors',
              active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Icon className="size-5" aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}
