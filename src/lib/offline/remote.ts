import { type SupabaseClient } from '@supabase/supabase-js';
import { type WataEvent, eventSchema } from '@/lib/events/schemas';
import { type RemoteAdapter } from './types';

/**
 * Supabase-backed RemoteAdapter. Upserts are idempotent on the primary key,
 * so replaying the outbox after a flaky connection can't duplicate rows.
 */
export class SupabaseRemote implements RemoteAdapter {
  constructor(private readonly supabase: SupabaseClient) {}

  async push(events: WataEvent[]): Promise<void> {
    if (events.length === 0) return;
    const { error } = await this.supabase.from('events').upsert(events, { onConflict: 'id' });
    if (error) throw new Error(`push failed: ${error.message}`);
  }

  async pull(since: string | null): Promise<WataEvent[]> {
    let query = this.supabase.from('events').select('*').order('updated_at', { ascending: true });
    if (since) query = query.gt('updated_at', since);

    const { data, error } = await query;
    if (error) throw new Error(`pull failed: ${error.message}`);

    // Trust-but-validate: a schema drift should surface loudly, not corrupt
    // the local store.
    return (data ?? []).map((row) => eventSchema.parse(row));
  }
}
