# 红檬智型 WingGuard

鸟类生态保护双端联动 Web 平台。

- **C 端（公众用户端）**：面向大众的游戏化观鸟与生态科普平台（移动端优先），旨在提升大众鸟类保护意识。包含科普图鉴、AI 智能识鸟、高德地图定位打点与沉浸式迁徙叙事。
- **B 端（管理决策端）**：面向生态管理部门的数据监测后台（桌面宽屏优先），支持公众上报数据审核、紧急事件处理、可视化生态分析与数据导出。

两端通过统一的 `DataAdapter` 数据适配层连接：C 端提交观测 → 状态为 `pending` → B 端审核队列实时可见 → 管理员批准 → 状态变为 `approved` → C 端用户积分与等级同步更新。整个流程支持在无刷新（或实时响应）的状态下完整演示。

---

## 核心功能页面与多页面架构

本项目采用基于 Vite + Rollup 支撑的现代化多页面架构，各个页面的定位如下：

1. **首页入口与科普叙事层** ([home.html](file:///f:/WingGuard-/home.html)):
   - 采用 3D 地球与飞线交互动效展现候鸟迁徙路径。引导公众快速进入其他科普与观测模块。
2. **迁徙日记长滚动** ([diary.html](file:///f:/WingGuard-/diary.html)):
   - 基于 Lenis + GSAP/ScrollTrigger 实现的 Scrollytelling 候鸟迁徙日记，包含上下文感知的 AI 助手问题引导气泡。
3. **重点保护鸟类图鉴** ([birds.html](file:///f:/WingGuard-/birds.html)):
   - 响应式卡片网格布局，包含全屏高清图集查看与保护级别标注（国家一级、三有保护等），具备点击缩略图放大查看的动效及引导。
4. **AI 智能识鸟** ([identify.html](file:///f:/WingGuard-/identify.html)):
   - 集成高德地图 JS API 2.0，支持用户定位、拖拽地图打点以及打点预览。
   - 上传或拍摄鸟类照片后，调用 AI 分析并自动写入 `DataAdapter` 观测数据库，并在地图上实时标注。
5. **C 端打卡与 B 端决策控制台** ([index.html](file:///f:/WingGuard-/index.html)):
   - 提供用户注册登录、守护物种契约绑定、手动观测表单上报、紧急事件（受伤/非法捕猎等）举报。
   - B 端管理控制台支持待审核队列实时审批、紧急事件处理状态更新、Chart.js 生态数据可视化分析、以及 CSV 数据一键导出。
6. **湿地面临威胁与保护行动指南** ([protect.html](file:///f:/WingGuard-/protect.html)):
   - 采用精致的排版与对比设计，向公众科普湿地面临的各种生态威胁及可采取的具体行动。
7. **黑脸琵鹭迁徙科普文章** ([story.html](file:///f:/WingGuard-/story.html)):
   - 针对单一物种的深描，讲述黑脸琵鹭迁徙背后的科学常识。
8. **项目愿景与团队介绍** ([about.html](file:///f:/WingGuard-/about.html)):
   - 介绍项目的发起背景、团队成员、以及对于未来鸟类保护技术路线的展望。

---

## 目录结构

```text
wingguard/
├── index.html              # C端个人中心 / 观测上报 + B端生态决策控制台
├── home.html               # 沉浸式迁徙叙事首页（包含 3D 地球动效）
├── diary.html              # 候鸟迁徙日记（Scrollytelling + AI 引导）
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
│   ├── main.js             # 核心业务页面（index.html）逻辑渲染层
│   ├── diary.js            # 迁徙日记长滚动动画及 AI 气泡交互逻辑
│   ├── enhance.js          # index.html 动效增强（Lenis 平滑滚动、Scroll Reveal）
│   ├── hero3d.js           # 首页 3D 地球及飞线迁徙动画（基于 Three.js）
│   ├── env.js              # Supabase 环境变量配置
│   └── DataAdapter.js      # 统一数据适配层（包含本地 Mock 兜底与 Supabase 读写）
├── API_CONTRACT.md         # 接口契约文档
├── supabase_schema.sql     # 数据库基础脚本（profiles表 + RLS安全策略 + 注册触发器）
└── supabase_schema_v2.sql  # 数据库扩展脚本（species/observations/reports 表结构及预置种子数据）
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
   启动开发服务器后，访问控制台提示的本地地址（默认配置为 `http://localhost:3000`）。

3. **生产构建**：
   ```bash
   npm run build
   ```
   构建产物将输出在 `dist/` 目录。

---

## 配置 Supabase 真实数据库

若需启用云端数据库及真实注册登录，请按照以下步骤配置 Supabase：

1. 在 [Supabase 控制台](https://supabase.com) 创建新项目。
2. 打开 **SQL Editor**，按顺序粘贴并执行以下两个 SQL 脚本：
   - **第一步**：执行 `supabase_schema.sql`，完成用户档案（`profiles`）表的建立、RLS 安全策略、以及用户注册自动同步触发器。
   - **第二步**：执行 `supabase_schema_v2.sql`，完成物种（`species`）、观测（`observations`）、异常举报（`reports`）的建表、RLS 权限控制、并导入预置物种的初始化种子数据。
3. 打开 `src/env.js`，填入您项目的 URL 与 anon key：

```javascript
export const ENV = {
  SUPABASE_URL: "https://你的项目.supabase.co",
  SUPABASE_ANON_KEY: "你的 anon/publishable key",
  ADMIN_INVITE_CODES: ["ADMIN2026"], // 允许注册管理员的邀请码列表
  FORCE_LOCAL_MOCK: false            // 设为 true 时强制全部降级为本地 localStorage 演示模式
};
```

> ⚠️ `postgresql://...` 数据库连接串仅用于后端迁移，**请勿**填进前端代码。前端仅需 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`，真实安全边界由 Supabase 的 RLS（行级安全）策略在数据库端进行防守。

---

## 数据适配层混合模式说明

生态业务数据（观测记录 / 物种百科 / 异常举报）默认支持 **混合模式**：
- 当配置了正确的 Supabase 凭证且网络畅通时，系统会实时读取并写入 Supabase 真实云端数据库。
- 若 `env.js` 未配置、网络不可达或 `FORCE_LOCAL_MOCK` 为 `true` 时，`DataAdapter` 会**自动降级为本地演示模式**，将所有数据存入浏览器的 `localStorage` 中。这保证了在没有网路或者没有配置后端的情况下，依然能向用户或答辩专家演示完整的闭环流程。
- 数据结构在字段上高度契合 **GBIF Darwin Core** 标准（如 `scientificName`、`recordedBy`、`decimalLatitude` 等），极大方便后续对接真实的生态观测 API。

---

## 演示脚本（建议的答辩/汇报流程）

为了展示双端联动的核心功能，您可以按照以下步骤进行完整的功能演示：

1. **普通用户端数据上报**：
   - 打开 `index.html`，进入「参与守护」区域，点击「注册 / 登录」并注册一个 **公众账号**。
   - 登录后，选择绑定一个守护物种（例如东方白鹳）。
   - 在「提交观测记录」表单中，选择该物种，填入数量并上报（此时由于未经过审核，该条记录的状态处于 `pending`）。
   - 可以在「发起紧急上报」中上报一条鸟类异常紧急情况（如受伤、非法捕猎等）。
2. **管理员端实时审批与决策**：
   - 退出当前公众账号，进入导航栏「生态决策后台」→「管理员专属通道」。
   - 使用管理员邀请码（如 `ADMIN2026`）注册并登录一个 **管理员账号**。
   - 此时在后台的「待审核观测队列」中可以看到刚刚公众用户提交 of 观测记录，点击「通过」按钮予以批准。
   - 在「异常举报待办池」中可以看到刚才举报的异常信息，点击「标记处理」完成结案。
3. **用户端反馈与后台数据可视化**：
   - 退出管理员账号，重新登录刚才的公众账号。
   - 在「我的守护档案」中，可以看到用户的生态积分增加了 100 pt，等级同步提升（每 300 积分升一级）。
   - 同时，后台的 Chart.js 统计图表（有效观测数、活跃物种数量、保护等级饼图）和高德地图上的打点分布均会自动重算并更新。

---

## 技术栈

HTML5 + Vite + ES Modules + Tailwind CSS + Three.js (WebGL 3D 渲染) + GSAP & ScrollTrigger (滚动视差) + Lenis (平滑滚动) + Chart.js (数据图表) + 高德地图 JS API 2.0 (地理打点) + Supabase JS SDK (Auth & Postgres).
