-- =========================================================================
-- 红檬智型 (WingGuard) — Supabase 数据库扩展脚本 (v2)
-- 请直接复制到 Supabase 项目的 SQL Editor 中执行。
-- =========================================================================

-- 1. species (物种百科)
create table if not exists public.species (
  id text primary key,
  scientific_name text not null,
  common_name text not null,
  conservation_status text,
  habitat text,
  description text,
  image_url text
);

alter table public.species enable row level security;
drop policy if exists "species_select_all" on public.species;
create policy "species_select_all" on public.species for select using (true);

drop policy if exists "species_all_admin" on public.species;
create policy "species_all_admin" on public.species for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- 初始化物种数据
insert into public.species (id, scientific_name, common_name, conservation_status, habitat, description, image_url) values
('sp-01', 'Ciconia boyciana', '东方白鹳', '国家一级', '大型湿地、沼泽、水库浅滩', '大型涉禽，体长约1.1–1.3米，嘴黑色而基部粗厚，眼周裸露皮肤呈醒目红色。全球种群数量稀少，是东亚湿地生态健康的重要指示物种。', '/Ciconia-boyciana.webp'),
('sp-02', 'Nipponia nippon', '朱鹮', '国家一级', '温带山地丘陵、稻田、溪流湿地', '素有“东方宝石”之称，体羽多为白色并微染粉红，后枕部有柳叶状羽冠。曾一度被认为野外灭绝，是人工保育成功的旗舰物种。', '/Nipponia-nippon.png'),
('sp-03', 'Aegithalos concinnus', '红头长尾山雀', '三有保护', '针阔混交林、灌木丛、公园绿地', '网络著名的“小肥啾”之一，头顶栗红、喉部一枚黑斑，性活泼喜结群，是校园与城市公园里最容易被公众观测到的鸟种之一。', '/Aegithalos-concinnus.webp'),
('sp-04', 'Ardea cinerea', '苍鹭', '三有保护', '江河、湖泊、海岸浅水区', '大型水鸟，颈、脚、嘴修长，体羽以灰色为主。常长时间静立浅水中伺机捕食鱼虾，民间俗称“老等”，是湿地食物链的重要一环。', '/Ardea-cinerea.jpg'),
('sp-05', 'Alcedo atthis', '普通翠鸟', '三有保护', '溪流、池塘、河岸土坡', '体型小巧，羽色艳丽如宝石，善于俯冲入水捕鱼，是许多观鸟爱好者入门的“梦幻鸟种”，对水质极为敏感。', '/Alcedo-atthis.webp'),
('sp-06', 'Grus japonensis', '丹顶鹤', '国家一级', '沼泽湿地、芦苇荡、滩涂', '体态优雅，顶冠裸皮呈朱红色，是长寿与吉祥的文化象征。对栖息地完整性要求极高，是区域生态保护成效的旗舰指标。', '/Grus-japonensis.jpg')
on conflict (id) do nothing;


-- 2. observations (观测记录)
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  species_id text references public.species(id),
  scientific_name text,
  common_name text,
  user_id uuid references public.profiles(id),
  recorded_by text,
  event_date date,
  decimal_latitude numeric,
  decimal_longitude numeric,
  individual_count integer default 1,
  photo_url text,
  note text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  submitted_at timestamp with time zone default now()
);

alter table public.observations enable row level security;

drop policy if exists "observations_select_all" on public.observations;
create policy "observations_select_all" on public.observations for select using (true);

drop policy if exists "observations_insert_auth" on public.observations;
create policy "observations_insert_auth" on public.observations for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

drop policy if exists "observations_update_admin" on public.observations;
create policy "observations_update_admin" on public.observations for update using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- 3. reports (异常举报)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  type text,
  location text,
  description text,
  photo_url text,
  status text check (status in ('pending', 'processed')) default 'pending',
  submitted_at timestamp with time zone default now()
);

alter table public.reports enable row level security;

drop policy if exists "reports_select_all" on public.reports;
create policy "reports_select_all" on public.reports for select using (true);

drop policy if exists "reports_insert_auth" on public.reports;
create policy "reports_insert_auth" on public.reports for insert with check (auth.role() = 'authenticated');

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports for update using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
