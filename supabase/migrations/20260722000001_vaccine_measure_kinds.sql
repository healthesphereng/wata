-- Coach follow-up: vaccine records and weight measurements as synced events.
-- The client probes for these values (lib/offline/capabilities.ts) and keeps
-- the features on-device until this migration is applied, so applying it is
-- safe at any time — pending features light up on the next app load.

alter type public.event_kind add value if not exists 'vaccine';
alter type public.event_kind add value if not exists 'measure';
