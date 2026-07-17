-- =========================================================================
-- 红檬智型 (WingGuard) — Supabase 数据库初始化脚本
-- 直接复制到 Supabase 项目的 SQL Editor 中执行即可。
-- =========================================================================

-- 1. profiles 表：与 auth.users 一对一关联，存储角色与业务字段
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text check (role in ('public', 'admin')) not null default 'public',
  nickname text,
  organization text,              -- 仅 admin 角色使用：所属管理部门
  guardian_species_id text,       -- 仅 public 角色使用：守护鸟种
  points integer default 0,
  level integer default 1,
  created_at timestamp with time zone default now()
);

-- 2. 开启行级安全 (RLS)
alter table public.profiles enable row level security;

-- 3. 读取策略：所有人可读所有 profile（排行榜 / 管理端用户列表需要）
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

-- 4. 更新策略：用户只能更新自己的记录
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. 安全触发器：禁止用户通过更新自己的 profile 来越权修改 role 字段
drop trigger if exists on_profile_update_security on public.profiles;
drop function if exists public.handle_profile_update_security();

create or replace function public.handle_profile_update_security()
returns trigger
language plpgsql
security definer
as $$
begin
  if (old.role is distinct from new.role) then
    new.role := old.role; -- 强制保留原角色，任何自助更新都不能改变 role
  end if;
  return new;
end;
$$;

create trigger on_profile_update_security
  before update on public.profiles
  for each row execute procedure public.handle_profile_update_security();

-- 6. 自动建档触发器：用户在 auth.users 完成注册后，自动写入 profiles
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
    role,
    organization,
    guardian_species_id
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', 'GreenObserver'),
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

-- =========================================================================
-- 说明：
--   - admin 角色的账号目前通过前端硬编码的邀请码（见 js/env.js 中的
--     ADMIN_INVITE_CODES）来限制注册，属于应用层防线。
--   - 上面的触发器 + RLS 策略是数据库层防线：即便有人绕开前端直接调用
--     Supabase API 修改自己的 role 字段，触发器也会强制把它改回原值。
--   - 两层防线合起来才是完整的权限隔离设计，这也是本项目值得写进
--     PBL 汇报的一个安全设计考量。
-- =========================================================================
