# 红檬智型 WingGuard

鸟类生态保护双端联动 Web 平台。

- **C 端**：面向公众的游戏化观鸟平台（移动端优先），提升大众鸟类保护意识。
- **B 端**：面向生态管理部门的数据监测后台（桌面宽屏优先），审核公众上报数据、辅助决策。

两端通过统一的 `DataAdapter` 数据适配层连接：C 端提交观测 → 状态为 `pending` →
B 端审核队列实时可见 → 管理员批准 → 状态变为 `approved` → C 端用户积分与图表
同步更新。整个流程可以在不刷新页面的情况下完整演示。

## 目录结构

```text
wingguard/
├── index.html              # 单页应用主程序（C端 + B端）
├── package.json            # 依赖配置，使用 Vite 作为构建工具
├── vite.config.js          # Vite 构建配置
├── tailwind.config.js      # TailwindCSS 主题和扩展配置
├── postcss.config.js       # PostCSS 配置
├── src/
│   ├── style.css           # 基础样式表及 Tailwind 指令
│   ├── main.js             # 页面逻辑渲染层
│   ├── env.js              # Supabase 环境变量（URL / anon key / 管理员邀请码）
│   └── DataAdapter.js      # 统一数据适配层（唯一允许读写数据的地方）
├── API_CONTRACT.md         # 接口契约文档
└── supabase_schema.sql     # profiles 建表 + RLS 策略 + 触发器
```

## 快速开始

本项目已重构为基于 Vite + ES Modules 的现代化前端架构。

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **本地开发**：
   ```bash
   npm run dev
   ```
   然后访问控制台提示的本地地址（如 `http://localhost:5173`）。

3. **生产构建**：
   ```bash
   npm run build
   ```
   构建产物将输出在 `dist/` 目录。

## 配置 Supabase（账号注册登录）

1. 在 [Supabase 控制台](https://supabase.com) 创建项目。
2. 打开 **SQL Editor**，粘贴并执行 `supabase_schema.sql`（建表 + RLS + 触发器）。
3. 打开 `src/env.js`，填入你项目的 URL 与 anon (publishable) key：

```javascript
export const ENV = {
  SUPABASE_URL: "https://你的项目.supabase.co",
  SUPABASE_ANON_KEY: "你的 anon/publishable key",
  ADMIN_INVITE_CODES: ["ADMIN2026"] // 管理员注册邀请码，可自行增删
};
```

> `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres` 这类
> 数据库连接串是给 `supabase` CLI / 后端迁移用的，**不要**填进前端代码。前端只需要
> 上面两个公开凭证，真正的安全边界由 `supabase_schema.sql` 里的 RLS 策略负责。

如果 `env.js` 未配置或 Supabase 不可达，`DataAdapter` 会自动降级为**本地演示模式**
（账号数据存在浏览器 `localStorage` 里），保证没有后端也能完整走一遍演示流程。

## 演示脚本（建议的答辩流程）

1. 在首页「参与守护」区域，点击「注册 / 登录」→ 注册一个 **公众账号**，登录。
2. 绑定一个守护物种，点击「填写观测表单」提交一条观测记录（状态进入 `pending`）。
3. 退出登录，点击导航栏「生态决策后台」→「管理员专属通道」，用邀请码
   `ADMIN2026` 注册一个 **管理员账号**，登录。
4. 后台的「待审核观测队列」会实时出现刚才的记录，点击「通过」。
5. 退出管理员，重新登录刚才的公众账号 → 「我的守护档案」积分 +100，等级同步刷新，
   后台的统计图表也已经重新计算。

## 从 Mock 数据切换到真实 API

生态业务数据（观测记录 / 物种百科 / 异常举报）目前存在浏览器 `localStorage` 中，
字段命名对齐 GBIF Darwin Core 标准。切换到真实后端时：

1. 打开 `src/DataAdapter.js`，找到标记为 "MOCK 实现" 的方法（`getObservations`、
   `submitObservation`、`reviewObservation`、`getSpecies`、`submitReport` 等）。
2. 把方法体内部的 `localStorage` 读写替换成对应的 `fetch('/api/...')` 调用。
3. 保持函数签名、入参、返回值结构与 `API_CONTRACT.md` 一致 —— `src/main.js` 里
   的 UI 渲染代码完全不需要改动。

## 技术栈

HTML5 + Vite + ES Modules + Tailwind CSS (PostCSS) + 原生 JavaScript + Chart.js（图表）+ Supabase JS SDK（Auth + Postgres）。
