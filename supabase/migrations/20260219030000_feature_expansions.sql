-- Migration for Feature Expansions (2026-02-19)

-- 1. Profile Updates (Photo, Points, Wallet)
alter table public.profiles 
add column if not exists avatar_url text,
add column if not exists points numeric default 0,
add column if not exists balance numeric default 0;

-- 2. Missions System
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reward_points numeric default 0,
  icon text, -- phosphor icon name
  action_url text, -- deep link or internal route
  created_at timestamptz default now()
);

create table if not exists public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  status text check (status in ('available', 'in_progress', 'completed', 'claimed')) default 'available',
  progress numeric default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, mission_id)
);

-- 3. Rating System (Reviews)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references public.profiles(id),
  target_user_id uuid references public.profiles(id), -- Could be collector or waste bank
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  transaction_id uuid, -- Optional link to pickup/deposit
  created_at timestamptz default now()
);

-- 4. Chat System
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('direct', 'support')) default 'direct',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chat_participants (
  room_id uuid references public.chat_rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.chat_rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 5. Wallet Transactions
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount numeric not null,
  type text check (type in ('credit', 'debit')) not null,
  category text, -- 'topup', 'payment', 'reward', 'transfer'
  description text,
  reference_id uuid, -- Link to pickup or external payment
  created_at timestamptz default now()
);

-- 6. Facilities Update
alter table public.facilities 
add column if not exists description text,
add column if not exists accepted_waste_types text[];

-- 7. AI Waste Lens
create table if not exists public.waste_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  image_url text not null,
  analysis_result jsonb not null, -- Stores the full AI JSON response
  detected_name text,
  detected_type text,
  estimated_value numeric,
  created_at timestamptz default now()
);

-- RLS Policies

-- User Missions
alter table public.missions enable row level security;
create policy "Missions are viewable by everyone" on public.missions for select using (true);

alter table public.user_missions enable row level security;
create policy "Users manage own missions" on public.user_missions for all using (user_id = auth.uid());

-- Reviews
alter table public.reviews enable row level security;
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Users can write reviews" on public.reviews for insert with check (reviewer_id = auth.uid());

-- Chat
alter table public.chat_rooms enable row level security;
create policy "Users can view rooms they are in" on public.chat_rooms for select using (
  exists (select 1 from public.chat_participants where room_id = id and user_id = auth.uid())
);

alter table public.chat_participants enable row level security;
create policy "Participants viewable by room members" on public.chat_participants for select using (
  exists (select 1 from public.chat_participants cp where cp.room_id = room_id and cp.user_id = auth.uid())
);

alter table public.messages enable row level security;
create policy "Users can view messages in their rooms" on public.messages for select using (
  exists (select 1 from public.chat_participants where room_id = messages.room_id and user_id = auth.uid())
);
create policy "Users can insert messages in their rooms" on public.messages for insert with check (
  exists (select 1 from public.chat_participants where room_id = messages.room_id and user_id = auth.uid())
);

-- Wallet
alter table public.wallet_transactions enable row level security;
create policy "Users view own transactions" on public.wallet_transactions for select using (user_id = auth.uid());

-- Waste Analysis
alter table public.waste_analysis enable row level security;
create policy "Users view own analysis" on public.waste_analysis for select using (user_id = auth.uid());
create policy "Users insert own analysis" on public.waste_analysis for insert with check (user_id = auth.uid());

-- Create Storage Buckets (Idempotent approach via SQL if possible, else manual)
-- Note: Supabase SQL bucket creation isn't standard in all extensions, usually done via dashboard or API.
-- We will assume buckets 'avatars' and 'waste_images' need to be created.
