# 翼守护 (WingGuard) — 数据接口契约 (API Contract)

所有数据读写都必须经过 `js/DataAdapter.js` 中的统一接口，UI 层永远不直接操作
`localStorage` 或 Supabase 客户端。字段命名参考 [GBIF Darwin Core](https://dwc.tdwg.org/)
规范，方便未来无缝切换到真实生态管理部门 API：只需替换方法体内部实现（把
localStorage 读写换成 `fetch('/api/...')`），保持函数签名与返回结构不变即可，
UI 层不需要任何改动。

---

## 1. 认证接口（已对接真实 Supabase 后端）

### 1.1 `DataAdapter.signUp(email, password, role, profileExtra)`

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码，至少 6 位 |
| role | `'public'` \| `'admin'` | 是 | 账号角色；admin 需在前端先校验邀请码 |
| profileExtra | object | 否 | `{ nickname?, organization?, guardianSpeciesId? }` |

返回：`Promise<User>`

### 1.2 `DataAdapter.signIn(email, password)`
返回：`Promise<{ user, profile }>`

### 1.3 `DataAdapter.signOut()`
返回：`Promise<void>`

### 1.4 `DataAdapter.getCurrentUser()`
返回：`Promise<Profile | null>`，字段见下方数据模型。

---

## 2. 业务数据接口（当前为 Mock 实现，见文件头注释）

### 2.1 `DataAdapter.getObservations(filters)`

| 参数 | 类型 | 说明 |
|---|---|---|
| filters.status | string | `pending` \| `approved` \| `rejected` |
| filters.userId | string | 按上报人过滤 |
| filters.speciesId | string | 按物种过滤 |

返回字段（单条 Observation）：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 记录 ID |
| speciesId | string | 物种 ID |
| scientificName | string | 学名（Darwin Core: scientificName） |
| commonName | string | 中文俗名 |
| userId | string | 上报者 ID |
| recordedBy | string | 上报者昵称（Darwin Core: recordedBy） |
| eventDate | string | 观测日期 `YYYY-MM-DD`（Darwin Core: eventDate） |
| decimalLatitude | number | 纬度（Darwin Core: decimalLatitude） |
| decimalLongitude | number | 经度（Darwin Core: decimalLongitude） |
| individualCount | number | 观测数量（Darwin Core: individualCount） |
| photoUrl | string | 照片 URL |
| note | string | 备注 |
| status | string | `pending` \| `approved` \| `rejected` |
| submittedAt | string (ISO) | 提交时间 |

### 2.2 `DataAdapter.submitObservation(data)`

| 参数 | 类型 | 必填 |
|---|---|---|
| speciesId | string | 是 |
| individualCount | number | 是 |
| decimalLatitude | number | 是 |
| decimalLongitude | number | 是 |
| note | string | 否 |
| photoUrl | string | 否 |

返回：新建的 Observation（默认 `status: 'pending'`）。

### 2.3 `DataAdapter.reviewObservation(id, status)`

| 参数 | 类型 | 说明 |
|---|---|---|
| id | string | 观测记录 ID |
| status | `'approved'` \| `'rejected'` | 审核结果 |

联动逻辑：审核通过时自动为上报者增加 100 积分，并按「每 300 分升 1 级」重新计算等级。

### 2.4 `DataAdapter.getSpecies()`
返回 Species 数组：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 物种 ID |
| scientificName | string | 学名 |
| commonName | string | 中文名 |
| conservationStatus | string | 保护等级 |
| habitat | string | 栖息地 |
| description | string | 简介 |
| imageUrl | string | 图片 URL |

### 2.5 `DataAdapter.submitReport(data)` / `DataAdapter.getReports(filters)` / `DataAdapter.resolveReport(id)`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 举报 ID |
| userId | string | 举报人 |
| type | string | `injured` \| `hunting` \| `destruction` |
| location | string | 地点 |
| description | string | 情况说明 |
| status | string | `pending` \| `processed` |
| submittedAt | string (ISO) | 提交时间 |

### 2.6 `DataAdapter.getLeaderboard()`
返回按积分降序排列的公众用户档案数组（取前 10）。

### 2.7 `DataAdapter.getDashboardStats()`

返回：

```json
{
  "cards": {
    "totalObservations": 0,
    "activeSpeciesCount": 0,
    "pendingReviews": 0,
    "activeReports": 0
  },
  "charts": {
    "monthlyTrend": { "labels": ["2月","3月"], "data": [12, 18] },
    "conservationPie": { "labels": ["国家一级","三有保护"], "data": [20, 35] }
  }
}
```

---

## 3. 数据模型（Profile / User）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键，关联 `auth.users.id` |
| role | `'public'` \| `'admin'` | 角色，禁止用户自助修改（见 supabase_schema.sql 触发器） |
| nickname | string | 昵称 |
| organization | string \| null | 仅 admin 使用 |
| guardian_species_id | string \| null | 仅 public 使用 |
| points | integer | 积分 |
| level | integer | 等级（每 300 分升一级） |
| created_at | timestamptz | 创建时间 |
