
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

-- Only authenticated users with the trusted admin app_metadata role can update statuses.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'enquiries'
      and policyname = 'Admins can update enquiry status'
  ) then
    create policy "Admins can update enquiry status"
    on public.enquiries
    for update
    to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  end if;
end
$$;
