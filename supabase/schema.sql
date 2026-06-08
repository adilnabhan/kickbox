create type user_role as enum ('admin', 'fighter', 'referee');
create type registration_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type match_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled', 'walkover');
create type result_type as enum ('points', 'knockout', 'technical_knockout', 'disqualification', 'walkover');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  mobile_number text,
  role user_role not null default 'fighter',
  created_at timestamptz not null default now()
);

create table public.championships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venue text,
  start_date date,
  end_date date,
  registration_start date,
  registration_end date,
  status text not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.age_categories (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  min_age int not null,
  max_age int
);

create table public.weight_categories (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  gender text not null,
  name text not null,
  min_weight numeric,
  max_weight numeric
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  fighter_id uuid not null references public.profiles(id) on delete cascade,
  age_category_id uuid references public.age_categories(id),
  weight_category_id uuid references public.weight_categories(id),
  date_of_birth date not null,
  gender text not null,
  weight_kg numeric not null,
  experience_level text,
  club_name text,
  coach_name text,
  address text,
  status registration_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  match_number int not null,
  round_name text not null,
  fighter_a_id uuid references public.profiles(id),
  fighter_b_id uuid references public.profiles(id),
  winner_id uuid references public.profiles(id),
  referee_id uuid references public.profiles(id),
  ring_number text,
  scheduled_at timestamptz,
  status match_status not null default 'scheduled',
  result result_type,
  score text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.championships enable row level security;
alter table public.age_categories enable row level security;
alter table public.weight_categories enable row level security;
alter table public.registrations enable row level security;
alter table public.matches enable row level security;

create policy "Profiles are readable by signed in users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Championships are public readable"
  on public.championships for select
  to anon, authenticated
  using (true);

create policy "Fighters can create their registrations"
  on public.registrations for insert
  to authenticated
  with check (auth.uid() = fighter_id);

create policy "Fighters can read own registrations"
  on public.registrations for select
  to authenticated
  using (auth.uid() = fighter_id);

create policy "Matches are readable by signed in users"
  on public.matches for select
  to authenticated
  using (true);

