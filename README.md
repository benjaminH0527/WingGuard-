# 红檬智型 WingGuard

鸟类生态保护双端联动 Web 平台。

- **C 端**：面向公众的游戏化观鸟平台（移动端优先），提升大众鸟类保护意识。包含科普图鉴、AI识图打点与沉浸式迁徙故事。
- **B 端**：面向生态管理部门的数据监测后台（桌面宽屏优先），审核公众上报数据、辅助决策。

两端通过统一的 `DataAdapter` 数据适配层连接：C 端提交观测 → 状态为 `pending` → B 端审核队列实时可见 → 管理员批准 → 状态变为 `approved` → C 端用户积分与图表同步更新。整个流程可以在不刷新页面的情况下完整演示。

---

## 核心功能页面

1. **首页入口与科普叙事层** (`home.html`):
   - 包含沉浸式迁徙体验介绍，指引公众进入各子页面。
2. **迁徙日记长滚动** (`diary.html`):
   - 基于 Lenis + GSAP/ScrollTrigger 实现的 Scrollytelling 候鸟迁徙日记，包含上下文感知的 AI 助手问题引导气泡。
3. **重点鸟类图鉴** (`birds.html`):
   - 响应式网格布局，包含全屏高清图集查看与保护级别标注（国家一级、三有保护等）。
4. **AI 智能识鸟** (`identify.html`):
   - 集成高德地图 JS API，支持获取用户定位、拖拽地图打点。
   - 上传或拍摄鸟类照片后，调用 AI 分析并自动写入 `DataAdapter` 观测数据库，并在地图上实时标注。
5. **C 端打卡与 B 端决策控制台** (`index.html`):
   - 提供用户登录、守护物种契约绑定、手动观测表单上报、紧急事件（受伤/非法捕猎等）举报。
   - B 端管理控制台支持待审核队列实时审批、紧急事件处理状态更新、Chart.js 生态数据可视化分析、以及 CSV 数据一键导出。

---

## 目录结构

```text
wingguard/
├── index.html              # 核心业务主页面（C端功能区 + B端生态决策后台）
├── home.html               # 沉浸式迁徙叙事首页
├── diary.html              # 候鸟迁徙日记（Scrollytelling + AI 助手引导）
├── birds.html              # 重点保护鸟类图鉴（支持全屏查看）
├── identify.html           # AI 智能识鸟（高德地图打点 + AI 识图入库）
├── protect.html            # 湿地面临威胁与保护行动指南
├── story.html              # 黑脸琵鹭迁徙科普文章
├── about.html              # 项目愿景与团队介绍
├── package.json            # 依赖配置，使用 Vite 作为构建工具
├── vite.config.js          # Vite 构建配置，配置多页面 Rollup 入口
├── tailwind.config.js      # TailwindCSS 主题和扩展配置
├── postcss.config.js       # PostCSS 配置
├── src/
│   ├── style.css           # 基础样式表及 Tailwind 指令
│   ├── narrative.css       # 叙事及图鉴等科普页面的主题设计样式
│   ├── main.js             # 核心页面逻辑渲染层
│   ├── diary.js            # 迁徙日记长滚动动画及 AI 气泡逻辑
│   ├── env.js              # Supabase 环境变量及配置
│   └── DataAdapter.js      # 统一数据适配层（包含本地 Mock 兜底与 Supabase 读写）
├── API_CONTRACT.md         # 接口契约文档
├── supabase_schema.sql     # 数据库基础脚本（profiles 表 + RLS 策略 + 触发器）
└── supabase_schema_v2.sql  # 数据库扩展脚本（species/observations/reports 表及策略）
```

---

## 快速开始

本项目基于 Vite + ES Modules 的现代化多页面架构。

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **本地开发**：
   ```bash
   npm run dev
   ```
   然后访问控制台提示的本地地址（如 `http://localhost:3000`）。

3. **生产构建**：
   ```bash
   npm run build
   ```
   构建产物将输出在 `dist/` 目录。

---

## 配置 Supabase（账号注册登录与数据入库）

1. 在 [Supabase 控制台](https://supabase.com) 创建项目。
2. 打开 **SQL Editor**，按顺序粘贴并执行以下两个 SQL 脚本：
   - **第一步**：执行 `supabase_schema.sql`，完成用户档案（`profiles`）表的建立、RLS 安全策略、以及用户注册自动同步触发器。
   - **第二步**：执行 `supabase_schema_v2.sql`，完成物种（`species`）、观测（`observations`）、异常举报（`reports`）的建表、RLS 权限控制、并导入预置物种的初始化种子数据。
3. 打开 `src/env.js`，填入你项目的 URL 与 anon (publishable) key：

```javascript
export const ENV = {
  SUPABASE_URL: "https://你的项目.supabase.co",
  SUPABASE_ANON_KEY: "你的 anon/publishable key",
  ADMIN_INVITE_CODES: ["ADMIN2026", "ECOGUARD-PILOT"], // 允许注册管理员的邀请码列表
  FORCE_LOCAL_MOCK: false // 设为 true 时强制全部降级为本地 localStorage 演示模式
};
```

> `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres` 数据库连接串仅用于后端迁移，**不要**填进前端代码。真正的安全边界由 Supabase 的 RLS 策略负责。

---

## 演示脚本（建议的答辩流程）

1. 打开 `index.html`，在「参与守护」区域，点击「注册 / 登录」→ 注册一个 **公众账号** 并登录。
2. 绑定一个守护物种，点击「填写观测表单」提交一条观测记录（此时该记录状态为 `pending`）。
3. 点击「发起紧急上报」提交一条候鸟异常举报记录（如在某湿地发现受伤黑脸琵鹭）。
4. 退出登录，点击导航栏「生态决策后台」→「管理员专属通道」，使用配置的管理员邀请码（如 `ADMIN2026`）注册并登录一个 **管理员账号**。
5. 后台的「待审核观测队列」会实时出现刚才的 `pending` 记录，点击「通过」；在「异常举报待办池」中查看并点击「标记处理」。
6. 退出管理员，重新登录刚才的公众账号 → 「我的守护档案」积分增加 100 pt，等级同步刷新，后台的统计图表（有效观测、活跃物种、图表指标）也已重新计算。

---

## 从 Mock 数据切换到真实 API

生态业务数据（观测记录 / 物种百科 / 异常举报）默认为混合模式：当 Supabase 连接成功时实时读取真实云端数据库，断开连接或 `FORCE_LOCAL_MOCK` 为 `true` 时降级读取 `localStorage`。

未来如果需要将本平台接入其他真实的生态管理部门专属 REST API：
1. 打开 `src/DataAdapter.js`，修改对应方法（如 `getObservations`、`submitObservation` 等）。
2. 将其中的方法实现替换为对应的外部 `fetch` 或 `axios` 服务端调用。
3. 保持函数签名、入参、返回值结构与 `API_CONTRACT.md` 完全一致，即可确保所有前端 UI 渲染层代码无需做出任何改动。
