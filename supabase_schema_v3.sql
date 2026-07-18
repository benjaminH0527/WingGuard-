-- =========================================================================
-- WingGuard - Supabase Schema v3
-- 修复积分更新失败 (RLS) 及 邮箱 undefined 的问题
-- =========================================================================

-- 1. 扩展 profiles 表，增加 email 字段
alter table public.profiles add column if not exists email text;

-- 2. 补充管理员的 RLS 权限（允许管理员更新所有的 profile，以发放积分）
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- 3. 修复注册时的触发器，使 email 自动写入 profiles 表
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (
    id,
    nickname,
    email,
    role,
    organization,
    guardian_species_id
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', 'GreenObserver'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'public'),
    new.raw_user_meta_data->>'organization',
    new.raw_user_meta_data->>'guardian_species_id'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. 修复已经存在的旧用户的 email 字段为空的问题
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
