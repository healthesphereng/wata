-- Wata RLS: deny-by-default, everything scoped to families you belong to.
-- See docs/ARCHITECTURE.md §2.

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.events enable row level security;

-- Helper: families the current user is a member of. SECURITY DEFINER so the
-- function can read family_members without recursing through its own RLS.
create or replace function public.my_family_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id from public.family_members where user_id = auth.uid();
$$;

-- ---------- profiles ----------
create policy "own profile: read" on public.profiles
  for select using (user_id = auth.uid());
create policy "own profile: update" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- families ----------
create policy "member families: read" on public.families
  for select using (id in (select public.my_family_ids()));
create policy "member families: update" on public.families
  for update using (id in (select public.my_family_ids()))
  with check (id in (select public.my_family_ids()));

-- ---------- family_members ----------
-- You can see the roster of families you belong to.
create policy "member roster: read" on public.family_members
  for select using (family_id in (select public.my_family_ids()));
-- Managing membership (invites, role changes) is deferred to the co-parenting
-- feature; the signup trigger creates the owner row as SECURITY DEFINER.

-- ---------- children ----------
create policy "family children: read" on public.children
  for select using (family_id in (select public.my_family_ids()));
create policy "family children: insert" on public.children
  for insert with check (family_id in (select public.my_family_ids()));
create policy "family children: update" on public.children
  for update using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));
create policy "family children: delete" on public.children
  for delete using (family_id in (select public.my_family_ids()));

-- ---------- events ----------
-- Read/write only within your families. Deletes are soft (update deleted_at),
-- so no delete policy is granted — a hard delete is never allowed from clients.
create policy "family events: read" on public.events
  for select using (family_id in (select public.my_family_ids()));
create policy "family events: insert" on public.events
  for insert with check (
    family_id in (select public.my_family_ids())
    and created_by = auth.uid()
  );
create policy "family events: update" on public.events
  for update using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));
