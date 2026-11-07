
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  interest text not null,
  message text,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

create policy "Anyone can submit enquiry"
on public.enquiries
for insert
to anon
with check (true);
