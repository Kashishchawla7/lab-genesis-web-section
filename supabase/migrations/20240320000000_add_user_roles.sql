-- Create user_roles table
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create policies
create policy "Users can view their own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own role"
  on public.user_roles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own role"
  on public.user_roles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own role"
  on public.user_roles for delete
  using (auth.uid() = user_id); 