-- 迁移：群组、多收件人、保存状态
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (group_id, member_id)
);
create table if not exists public.share_targets (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.shares(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  saved_at timestamptz
);
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.share_targets enable row level security;
create policy if not exists groups_owner_sel on public.groups for select using (auth.uid() = owner_id);
create policy if not exists groups_owner_ins on public.groups for insert with check (auth.uid() = owner_id);
create policy if not exists groups_owner_upd on public.groups for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy if not exists groups_owner_del on public.groups for delete using (auth.uid() = owner_id);
create policy if not exists gm_owner_sel on public.group_members for select using (
  exists (select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = auth.uid())
  or member_id = auth.uid()
);
create policy if not exists gm_owner_ins on public.group_members for insert with check (
  exists (select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = auth.uid())
);
create policy if not exists gm_owner_del on public.group_members for delete using (
  exists (select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = auth.uid())
);
create policy if not exists st_visible on public.share_targets for select using (
  exists (select 1 from public.shares s where s.id = share_targets.share_id and (s.sender_id = auth.uid() or share_targets.recipient_id = auth.uid()))
);
create policy if not exists st_sender_insert on public.share_targets for insert with check (
  exists (select 1 from public.shares s where s.id = share_targets.share_id and s.sender_id = auth.uid())
);
create policy if not exists st_sender_delete on public.share_targets for delete using (
  exists (select 1 from public.shares s where s.id = share_targets.share_id and s.sender_id = auth.uid())
);
create policy if not exists st_recipient_update on public.share_targets for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
