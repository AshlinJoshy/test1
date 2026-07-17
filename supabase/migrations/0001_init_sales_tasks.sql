-- Sales task manager schema
create extension if not exists "pgcrypto";

create table if not exists public.sales_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client text,
  deal_value numeric,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Lead' check (status in ('Lead', 'Contacted', 'Proposal', 'Won', 'Lost')),
  follow_up_date date,
  notes text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- This app has no login, so the public (anon) key needs full access.
alter table public.sales_tasks enable row level security;

drop policy if exists "Public read access" on public.sales_tasks;
create policy "Public read access" on public.sales_tasks for select using (true);

drop policy if exists "Public insert access" on public.sales_tasks;
create policy "Public insert access" on public.sales_tasks for insert with check (true);

drop policy if exists "Public update access" on public.sales_tasks;
create policy "Public update access" on public.sales_tasks for update using (true) with check (true);

drop policy if exists "Public delete access" on public.sales_tasks;
create policy "Public delete access" on public.sales_tasks for delete using (true);
