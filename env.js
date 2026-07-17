/**
 * 环境变量配置文件
 * ------------------------------------------------------------------
 * 请勿把数据库密码（postgresql://postgres:[YOUR-PASSWORD]@...）写在这里 —
 * 那是给 Supabase CLI / 后端迁移用的连接串，前端永远不需要它。
 * 前端只需要下面两个"公开可用"的凭证：项目 URL 与 anon (publishable) key。
 * 这两个值本身是设计给客户端暴露的，真正的安全边界由 Supabase 的
 * Row Level Security (RLS) 策略负责（见 supabase_schema.sql）。
 * ------------------------------------------------------------------
 */
window.ENV = {
  SUPABASE_URL: "https://rmsqbhnvwhdlzdcfkzwn.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_q22LDtdUi81IFKlr8jjtzg_G9HMXXAR",
  ADMIN_INVITE_CODES: ["ADMIN2026", "ECOGUARD-PILOT"]
};
