create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled schedule',
  unlock_time time not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  repeat_type text not null check (repeat_type in ('daily', 'weekdays', 'weekends', 'custom')),
  repeat_days smallint[] not null default array[1,2,3,4,5,6,7],
  timezone text not null default 'UTC',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  package_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, package_name)
);

create table if not exists public.schedule_apps (
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  app_target_id uuid not null references public.app_targets(id) on delete cascade,
  primary key (schedule_id, app_target_id)
);

create index if not exists schedules_user_id_idx on public.schedules(user_id);
create index if not exists app_targets_user_id_idx on public.app_targets(user_id);

alter table public.schedules enable row level security;
alter table public.app_targets enable row level security;
alter table public.schedule_apps enable row level security;

drop policy if exists "Users can manage their schedules" on public.schedules;
create policy "Users can manage their schedules"
on public.schedules for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their app targets" on public.app_targets;
create policy "Users can manage their app targets"
on public.app_targets for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their schedule app links" on public.schedule_apps;
create policy "Users can manage their schedule app links"
on public.schedule_apps for all
using (
  exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = auth.uid())
  and exists (select 1 from public.app_targets a where a.id = app_target_id and a.user_id = auth.uid())
)
with check (
  exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = auth.uid())
  and exists (select 1 from public.app_targets a where a.id = app_target_id and a.user_id = auth.uid())
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schedules_touch_updated_at on public.schedules;
create trigger schedules_touch_updated_at
before update on public.schedules
for each row execute function public.touch_updated_at();
