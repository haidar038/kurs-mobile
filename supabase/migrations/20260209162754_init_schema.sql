-- KURS Database Schema
-- Run with: bunx supabase migration new initial_schema

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text check (role in ('user', 'collector', 'waste_bank_staff', 'admin')) default 'user',
  avatar_url text,
  created_at timestamptz default now()
);

-- Collectors
create table if not exists public.collectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  vehicle_type text,
  license_plate text,
  status text check (status in ('available', 'busy', 'offline')) default 'offline',
  current_location jsonb,
  created_at timestamptz default now()
);

-- Facilities (TPS, Waste Banks)
create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('tps', 'waste_bank')) not null,
  address text,
  location jsonb,
  opening_hours jsonb,
  contact text,
  created_at timestamptz default now()
);

-- Pickup requests
create table if not exists public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  collector_id uuid references public.collectors(id),
  status text check (status in ('requested', 'assigned', 'en_route', 'completed', 'cancelled')) default 'requested',
  location jsonb not null,
  address text,
  waste_types text[] not null,
  photos text[] default '{}',
  volume_estimate text,
  scheduled_at timestamptz,
  notes text,
  fee numeric default 10000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Deposits
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  depositor_id uuid references public.profiles(id) on delete cascade,
  waste_bank_id uuid references public.facilities(id),
  verified_by uuid references public.profiles(id),
  waste_type text not null,
  weight numeric,
  photos text[] default '{}',
  notes text,
  status text check (status in ('pending', 'verified', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  pickup_request_id uuid references public.pickup_requests(id),
  amount numeric not null,
  method text check (method in ('cash', 'wallet', 'transfer')),
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  created_at timestamptz default now()
);

-- Articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  tags text[] default '{}',
  cover_image text,
  author_id uuid references public.profiles(id),
  published boolean default false,
  created_at timestamptz default now()
);

-- Bookmarks
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, article_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.collectors enable row level security;
alter table public.facilities enable row level security;
alter table public.pickup_requests enable row level security;
alter table public.deposits enable row level security;
alter table public.payments enable row level security;
alter table public.articles enable row level security;
alter table public.bookmarks enable row level security;

-- RLS Policies

-- Profiles
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Collectors
create policy "Collectors are viewable by authenticated" on public.collectors
  for select to authenticated using (true);
create policy "Collectors can update own record" on public.collectors
  for update using (user_id = auth.uid());

-- Facilities are public read
create policy "Facilities are public" on public.facilities
  for select using (true);

-- Pickup requests
create policy "Users can read own pickups" on public.pickup_requests
  for select using (user_id = auth.uid() or collector_id in (
    select id from public.collectors where user_id = auth.uid()
  ));
create policy "Users can insert own pickups" on public.pickup_requests
  for insert with check (user_id = auth.uid());
create policy "Users and collectors can update pickups" on public.pickup_requests
  for update using (user_id = auth.uid() or collector_id in (
    select id from public.collectors where user_id = auth.uid()
  ));
create policy "Collectors can view available pickups" on public.pickup_requests
  for select using (status = 'requested');

-- Deposits
create policy "Users can read own deposits" on public.deposits
  for select using (depositor_id = auth.uid() or verified_by = auth.uid());
create policy "Staff can insert deposits" on public.deposits
  for insert with check (true);

-- Articles public read
create policy "Published articles are public" on public.articles
  for select using (published = true);

-- Bookmarks
create policy "Users can manage own bookmarks" on public.bookmarks
  for all using (user_id = auth.uid());

-- Function to handle profile creation on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage buckets (run in Supabase Dashboard or via API)
-- 1. Create bucket: pickup-photos (public)
-- 2. Create bucket: deposit-photos (public)
