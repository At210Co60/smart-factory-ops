# 智能工厂设备运维管理平台 — 项目移交文档 (handoff)

> 本文档面向**接手本项目继续开发 / 演示 / 二次开发**的同学，目的是让你在最短时间内搞懂"这个项目能干什么、怎么运行、代码在哪里、坑在哪里"。

---

## 目录

1. [项目概况](#1-项目概况)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [核心功能模块](#4-核心功能模块)
5. [数据模型](#5-数据模型)
6. [API 封装](#6-api-封装)
7. [路由与守卫](#7-路由与守卫)
8. [工具函数](#8-工具函数)
9. [本地开发](#9-本地开发)
10. [环境变量](#10-环境变量)
11. [构建与部署](#11-构建与部署)
12. [Git & GitHub](#12-git--github)
13. [已完成清单](#13-已完成清单)
14. [已知问题](#14-已知问题)
15. [扩展建议](#15-扩展建议)
16. [注意事项](#16-注意事项)

---

## 1. 项目概况

### 1.1 项目简介

**智能工厂设备运维管理平台** 是一个面向中小型工厂的设备全生命周期管理 Web 应用。包含**设备台账、维护记录、工单流转、实时数据看板**四大模块。

- **设备台账**：24 台设备的只读档案 + 类型/状态/车间筛选 + 详情查看
- **工单管理**：12 条种子工单 + 新建工单 + 状态流转（待处理 → 处理中 → 已完成）
- **数据看板**：4 张 ECharts 数据图表 + 实时天气 + 关键 KPI 指标卡

### 1.2 移交信息

- **项目根目录**：`C:\Users\15271\Desktop\web-project`
- **GitHub**：`https://github.com/At210Co60/smart-factory-ops.git` （公开仓库）
- **主分支**：`main`
- **当前版本**：Day3 完整交付 + Day4 数据面板，共 3 个 commit
- **本地运行入口**：`http://localhost:8080`（vite 端口固定 8080）

### 1.3 项目能干什么（用户视角）

- **运维人员**：登录 → 看看板 → 找设备 → 看详情 → 创建工单 → 处理工单 → 标记完成
- **管理员**：查看实时天气、关键指标、设备类型/状态/车间/工单优先级 4 张可视化分析图

---

## 2. 技术栈

### 2.1 运行时依赖

| 库 | 版本 | 作用 |
|---|---|---|
| Vue | ^3.5.42 | 前端框架（Composition API + `<script setup>`） |
| Vue Router | ^4.6.4 | 路由管理 |
| Axios | ^1.20.0 | HTTP 请求 |
| ECharts | ^6.1.0 | 数据可视化图表 |

### 2.2 开发依赖

| 库 | 版本 | 作用 |
|---|---|---|
| Vite | ^8.3.0 | 构建工具 |
| TypeScript | ~6.0.2 | 类型系统 |
| @vitejs/plugin-vue | ^6.0.8 | Vue 单文件组件支持 |
| vue-tsc | ^3.3.11 | TypeScript 类型检查 |
| @vue/tsconfig | ^0.9.1 | Vue 推荐 TS 配置 |
| @types/node | ^24.13.3 | Node 类型 |

### 2.3 浏览器要求

现代浏览器（Chrome 90+, Edge 90+, Firefox 88+, Safari 14+），依赖 `localStorage` 和 `AbortController`。

### 2.4 为什么没有用 Pinia？

所有状态都是页面级 ref 或 localStorage 持久化，跨页面状态极少（主要是路由参数和工单数据），所以没有引入 Pinia。如果后续要做"全局通知/用户信息/多模块共享状态"再考虑引入。

---

## 3. 项目结构

```
web-project/
├── public/                       # 静态资源
├── src/
│   ├── api/                     # 网络请求封装
│   │   └── index.ts             # axios 实例 + 拦截器
│   ├── assets/                  # 全局样式 / 图片
│   ├── layouts/                 # 布局组件
│   │   └── BasicLayout.vue      # 登录后的外壳（左侧菜单 + 顶部栏）
│   ├── mock/                    # 模拟数据（前端 mock，不是真实后端）
│   │   └── data.ts              # 24 设备 + 12 工单 + 字典/状态工具
│   ├── router/
│   │   └── index.ts             # 路由表 + 登录态守卫
│   ├── utils/                   # 工具函数
│   │   └── stats.ts            # countBy 数据分析工具
│   ├── views/                   # 页面组件
│   │   ├── home/                # 数据看板
│   │   │   └── index.vue
│   │   ├── device/              # 设备模块
│   │   │   ├── list.vue         # 设备台账
│   │   │   └── detail.vue       # 设备详情
│   │   ├── order/               # 工单模块
│   │   │   ├── list.vue         # 工单列表
│   │   │   └── create.vue       # 创建工单
│   │   ├── dashboard/           # Day4 教学练习组件（未接入路由）
│   │   │   └── TypePie.vue      # 写死饼图练习
│   │   ├── login/index.vue      # 登录
│   │   └── register/index.vue   # 注册
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 入口文件
├── .env.development             # 本地开发环境变量（已 gitignore，不进版本）
├── .env.example                 # 环境变量模板（占位词 your_key_here）
├── .gitignore                   # Git 忽略规则
├── index.html                   # HTML 入口
├── package.json                 # 依赖 + 脚本
├── README.md                    # 项目介绍（已写好，17.7 KB）
├── handoff.md                   # 本文档
└── vite.config.ts               # Vite 配置（端口 8080 + 天行代理）
```

---

## 4. 核心功能模块

### 4.1 登录注册（`/login`, `/register`）

#### 能干什么

- 注册账号（用户名 + 密码，存到 localStorage）
- 登录（校验后写入 `fop_auth_v1`）
- 已登录状态访问 `/login` 自动跳 `/home`
- 未登录访问受保护页面自动跳 `/login`

#### 实现要点

- 登录态：`localStorage.setItem('fop_auth_v1', JSON.stringify({username, loginAt}))`
- 守卫位置：`src/router/index.ts` 的 `router.beforeEach`
- 没有真实后端，纯前端模拟

#### 文件位置

- `src/views/login/index.vue`
- `src/views/register/index.vue`

---

### 4.2 数据看板（`/home`）

#### 能干什么

页面从上到下分 4 大块：

**① 实时天气区**（基于天行数据 API）
- 4 张数据卡：城市 / 天气 / 实时气温 / 相对湿度
- 6 行信息列表：最高气温 / 最低气温 / 风向风力 / 空气质量(AQI) / 日期 / 星期
- 温馨提示块（tips，没数据时不渲染）
- 城市切换框（输入城市名按回车或点刷新）
- **localStorage 记忆城市**（`fop_weather_city_v1`），下次打开自动恢复
- **三态处理**：loading / error / empty

**② 关键指标卡**（实时计算）
- 设备总数：`DVICES.length`（固定 24）
- 待处理工单：`loadOrders().filter(o => o.status === 'pending').length`（活数据）

**③ 4 张 ECharts 数据图表**（2×2 网格）
| 位置 | 标题 | 类型 | 数据源 |
|---|---|---|---|
| 左上 | 设备类型分布 | 环形图 | `DVICES` 类型字段 |
| 右上 | 设备状态分布 | 饼图 | `DVICES.status` → 标签 |
| 左下 | 各车间设备数量 | 柱状图 | `DVICES.shop` |
| 右下 | 工单优先级分布 | 柱状图 | `loadOrders()` 优先级字段 |

**④ 工程化**：
- 4 个 chart 实例统一在 `onMounted` 初始化、`onUnmounted` 销毁（防内存泄漏）
- `onResize` 监听窗口变化时统一 resize
- resize 监听函数必须**具名**才能在 `removeEventListener` 里删掉
- 移动端响应式：4 张图自动堆叠成单列

#### 实现要点

- API 调用：`request.get('/tianapi/tianqi/index', { params: { city, type: 1 } })`
- 不需要传 key：拦截器自动注入 `VITE_TIANAPI_KEY`
- 业务错误（非 200 code）：拦截器自动 reject，业务代码直接 `catch(e => e.message)`
- 切换城市时上一次未完成请求自动 abort：拦截器用 AbortController 实现

#### 文件位置

- `src/views/home/index.vue`（430 行，包含所有 4 张图的 option 构建）

---

### 4.3 设备台账（`/device/list`）

#### 能干什么

- **搜索框**：按设备名称 / 设备编号 / 负责人搜索，350ms 防抖
- **类型筛选下拉**：数控机床 / 注塑机 / 工业机器人 / 动力设备 / 检测设备 + "全部"
- **状态筛选下拉**：运行 / 故障 / 停机 / 维护中 + "全部"
- **三条件叠加**：搜索框 + 类型 + 状态用 Vue computed 联动
- **设备列表**：表格展示（编号、名称、类型、车间、负责人、状态、投产日期、操作）
- **状态标签**：彩色 chip（运行=绿 / 故障=红 / 停机=灰 / 维护中=橙）
- **分页**：每页 10 条，前后页切换
- **操作列**：点"查看"跳 `/device/detail/:id`

#### 实现要点

- 数据源：`DVICES`（24 条固定数组）
- 筛选：`computed(() => DVICES.filter(...))` 链式组合
- 防抖：`setTimeout + ref` 实现 350ms 防抖
- 状态颜色：`DEVICE_STATUS[d.status].color` 映射到 CSS class

#### 文件位置

- `src/views/device/list.vue`（约 280 行）

---

### 4.4 设备详情（`/device/detail/:id`）

#### 能干什么

- **基本信息区**（8 项两列展示）：
  - 设备编号、名称、类型、车间
  - 型号、负责人、投产日期、最近保养日期
- **状态卡片**：状态标签 + 颜色
- **维护记录时间轴**：3 条历史维护记录
  - 每条包含：日期、标题、描述、操作人
  - **确定性生成**：用 `hashCode(id)` 派生，同一设备每次进页面内容一致
  - 故障设备（status=fault）的第一条强制设为"故障维修"
- **操作按钮区**：
  - 「返回台账」：跳 `/device/list`
  - 「为此设备创建工单」：跳 `/order/create?deviceId=EQ-XXXX`

#### 实现要点

- 路由参数：`useRoute().params.id` 拿设备编号
- 找不到设备：显示「设备不存在」+ 返回按钮
- 创建工单跳转带 `?deviceId=` 让创建页预选设备

#### 文件位置

- `src/views/device/detail.vue`（约 310 行）

---

### 4.5 工单管理（`/order/list`）

#### 能干什么

- **三个页签**（带角标）：
  - 待处理（5 条种子）
  - 处理中（3 条种子）
  - 已完成（4 条种子）
- **表格列**：
  - 工单号（`WO-YYYYMMDDNNN` 格式）
  - 关联设备（编号 + 名称）
  - 故障描述
  - 优先级标签（高=红 / 中=橙 / 低=绿）
  - 状态标签（待处理=橙 / 处理中=蓝 / 已完成=绿）
  - 时间列（**随页签变化**：待处理/处理中显示创建时间，已完成显示完成时间）
  - 操作（不同页签不同按钮）
- **状态流转**：
  - 待处理页签：操作列显示「开始处理」按钮
  - 处理中页签：操作列显示「标记完成」按钮
  - 已完成页签：操作列只显示「查看」
- **确认弹框**：半透明背景 + 取消/确认按钮（防误操作）
- **空状态**：某页签没有数据时显示「暂无该状态的工单」

#### 实现要点

- 数据源：`loadOrders()` 从 localStorage 读
- 流转操作：`saveOrders()` 写回 localStorage
- 页签切换：`computed` 过滤
- 弹框：`v-if` 控制可见性

#### 文件位置

- `src/views/order/list.vue`（约 390 行）

---

### 4.6 创建工单（`/order/create`）

#### 能干什么

- **设备选择器**：
  - 搜索框（按名称/编号过滤）
  - 下拉列表（最多展示 8 条匹配项）
  - 选中后变「编号·名称·车间」chip + 清除按钮
  - 支持 `?deviceId=` 预选（从设备详情跳过来）
- **故障描述**：
  - 多行文本框
  - **校验**：5-500 字（实时显示字数）
  - 错误提示：「描述不能少于 5 字」/「描述不能多于 500 字」
- **优先级选择**：三张卡片（高 / 中 / 低）
  - 不同颜色边框 + 选中态高亮
- **工单号自动生成**：实时预览 `WO-YYYYMMDDNNN` 格式
  - 日期为当天（YYYYMMDD）
  - NNN 为当日已有工单数 + 1（3 位补零）
- **提交按钮**：
  - 校验失败禁用
  - 校验通过可点击
  - 提交后跳 `/order/list` 并刷新

#### 实现要点

- 数据源：选设备从 `DVICES` 过滤
- 校验：computed 实时算 `isValid`
- 自动编号：基于 `loadOrders().filter(o => o.no.startsWith('WO-' + todayStr))` 计数
- 提交：`saveOrders([newOrder, ...existing])`

#### 文件位置

- `src/views/order/create.vue`（约 360 行）

---

## 5. 数据模型

### 5.1 设备（Device）

文件位置：`src/mock/data.ts`

```typescript
interface Device {
  id: string          // 设备编号 EQ-1001 ~ EQ-1024
  name: string        // 设备名称
  type: string        // 类型:数控机床 / 注塑机 / 工业机器人 / 动力设备 / 检测设备
  shop: string        // 车间:一号车间 / 二号车间 / 三号车间
  model: string       // 型号
  owner: string       // 负责人(中文姓名)
  startDate: string   // 投产日期 YYYY-MM-DD
  lastMaint: string   // 最近保养日期 YYYY-MM-DD
  status: 'running' | 'fault' | 'stopped' | 'maintain'
}
```

**数量分布**：24 台 = 数控 7 + 注塑 5 + 机器人 5 + 动力 4 + 检测 3
**状态分布**：运行 16 / 故障 3 / 停机 3 / 维护中 2
**车间分布**：一号 9 / 二号 8 / 三号 7

### 5.2 工单（WorkOrder）

```typescript
interface WorkOrder {
  no: string           // 工单号 WO-YYYYMMDDNNN
  deviceId: string     // 关联设备编号
  deviceName: string   // 设备名称(冗余存储,显示不用再回查)
  desc: string         // 故障描述(5-500 字)
  priority: 'high' | 'mid' | 'low'   // 优先级
  status: 'pending' | 'processing' | 'done'  // 状态
  createTime: string   // 创建时间 YYYY-MM-DD HH:mm
  finishTime: string   // 完成时间(已完成工单填,其他空字符串)
}
```

**种子工单**：12 条（待处理 5 / 处理中 3 / 已完成 4），全部集中在 `2026-10-13` 一天。

### 5.3 字典（Dictionary）

```typescript
DEVICE_STATUS: {
  running:  { label: '运行',   color: 'green' },
  fault:    { label: '故障',   color: 'red' },
  stopped:  { label: '停机',   color: 'gray' },
  maintain: { label: '维护中', color: 'orange' },
}

ORDER_STATUS: {
  pending:    { label: '待处理', color: 'orange' },
  processing: { label: '处理中', color: 'blue' },
  done:       { label: '已完成', color: 'green' },
}

PRIORITY: {
  high: { label: '高', color: 'red' },
  mid:  { label: '中', color: 'orange' },
  low:  { label: '低', color: 'green' },
}
```

颜色字段映射 CSS class（`.tag-green / .tag-red / .tag-gray / .tag-orange / .tag-blue`）。

### 5.4 localStorage 键

| Key | 类型 | 说明 |
|---|---|---|
| `fop_auth_v1` | JSON | 登录态 `{username, loginAt}` |
| `fop_orders_v1` | JSON | 工单数组（活数据，可增删改） |
| `fop_weather_city_v1` | string | 上次查询的天气城市 |

清空 localStorage = 工单回到 12 条种子、要求重新登录、天气重置为福州。

---

## 6. API 封装

文件位置：`src/api/index.ts`（约 105 行）

### 6.1 用法

```typescript
import request from '@/api'

// GET 请求（推荐）
const res = await request.get('/tianapi/tianqi/index', {
  params: { city: '福州', type: 1 },
})
console.log(res.data)  // 已经是完整返回体 { code, msg, result }

// POST 请求（key 注入到 params）
const res = await request.post('/xxx', null, { params: { foo: 'bar' } })
```

### 6.2 4 个核心亮点

| 机制 | 实现 | 价值 |
|---|---|---|
| **自动补 key** | 请求拦截器读 `import.meta.env.VITE_TIANAPI_KEY` 自动注入 params.key | 业务代码不需要关心 key |
| **自动判 code** | 响应拦截器判 `res.data.code !== 200` 直接 reject | 业务代码不需要重复判 `if (res.code !== 200)` |
| **AbortController 自动取消** | 拦截器用 `method + url` 当 key，相同请求来一遍自动 abort 上一次 | 用户快速切换城市时上一次请求不会污染数据 |
| **静默取消** | AbortController 抛的错标记 `err.silent = true` | 业务代码可以选择不显示取消错误给用户 |

### 6.3 业务代码模板

```typescript
async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await request.get('/xxx', { params: {...} })
    data.value = res.data.result
  } catch (e: any) {
    if (e?.silent) return         // 静默取消不报错
    errorMsg.value = e.message     // 真实错误展示
  } finally {
    loading.value = false
  }
}
```

---

## 7. 路由与守卫

文件位置：`src/router/index.ts`

### 7.1 路由表

| 路径 | 组件 | 标题 | 是否需登录 |
|---|---|---|---|
| `/login` | `views/login/index.vue` | 登录 | ❌ |
| `/register` | `views/register/index.vue` | 注册 | ❌ |
| `/` | 重定向 `/login` | - | - |
| `/home` | `views/home/index.vue` | 数据看板 | ✅ |
| `/device/list` | `views/device/list.vue` | 设备台账 | ✅ |
| `/device/detail/:id` | `views/device/detail.vue` | 设备详情 | ✅ |
| `/order/list` | `views/order/list.vue` | 工单管理 | ✅ |
| `/order/create` | `views/order/create.vue` | 创建工单 | ✅ |

注：根路径 `/` 重定向到 `/login`，登录后守卫跳 `/home`。

### 7.2 守卫逻辑

```typescript
router.beforeEach((to) => {
  const auth = localStorage.getItem('fop_auth_v1')
  if (to.meta.requiresAuth && !auth) return '/login'
  if (to.path === '/login' && auth) return '/home'
  document.title = (to.meta.title as string) || '智能工厂设备运维管理平台'
})
```

---

## 8. 工具函数

文件位置：`src/utils/stats.ts`

### 8.1 countBy

```typescript
export function countBy<T>(list: T[], getKey: (item: T) => string): { name: string; value: number }[]
```

**作用**：按某个字段分组计数，返回 ECharts 直接吃的 `[{name, value}]` 结构。

**实现**：用 `Map` 统计，最后 `Array.from(map)` 转回对象数组。

**用法示例**：

```typescript
import { countBy } from '@/utils/stats'

// 设备状态分布
const statusData = countBy(DEVICES, d => DEVICE_STATUS[d.status].label)
// → [{name: '运行', value: 16}, {name: '故障', value: 3}, ...]

// 车间分布
const shopData = countBy(DEVICES, d => d.shop)
// → [{name: '一号车间', value: 9}, ...]
```

Dashboard 的 4 张图都依赖这个工具。

---

## 9. 本地开发

### 9.1 必备环境

- Node.js 18+（建议 20 LTS）
- npm 9+ 或 pnpm
- 一个天行数据 API key（https://www.tianapi.com/ 注册免费拿）

### 9.2 启动步骤

```bash
# 1. 克隆仓库
git clone https://github.com/At210Co60/smart-factory-ops.git
cd smart-factory-ops

# 2. 安装依赖
npm install

# 3. 配置环境变量
# 在项目根目录创建 .env.development，写入：
# VITE_TIANAPI_KEY=你的天行数据key

# 4. 启动开发服务器
npm run dev
# 默认跑在 http://localhost:8080

# 5. 浏览器打开
# 访问 http://localhost:8080/login
# 注册任意账号 → 自动登录 → 进入数据看板
```

### 9.3 常用脚本

```bash
npm run dev       # 启动 dev server（端口 8080）
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览构建产物（端口 4173）
```

---

## 10. 环境变量

### 10.1 必需变量

| 变量 | 说明 | 示例 |
|---|---|---|
| `VITE_TIANAPI_KEY` | 天行数据 API key | `abcd1234...` |

### 10.2 文件管理

- `.env.development`：**本地开发用**，已 `.gitignore`，**不**进版本
- `.env.example`：**模板**，进版本，里面用 `your_key_here` 占位

### 10.3 安全提醒

- **绝对不要**把真实 key 提交到 Git 仓库
- 提交前用 `git status` 检查 `.env.development` 不在待提交列表
- 如果不小心 commit 了，立即到天行后台撤销

---

## 11. 构建与部署

### 11.1 构建

```bash
npm run build
```

输出：
- `dist/index.html`
- `dist/assets/*.js`
- `dist/assets/*.css`

### 11.2 部署方式

**静态托管**（推荐）：
- Vercel / Netlify：直接连接 GitHub 仓库，自动部署
- GitHub Pages：把 `dist/` 推送到 `gh-pages` 分支
- 自建 Nginx：把 `dist/` 放到服务器，配置 try_files $uri $uri/ /index.html;

**注意 SPA 路由**：`/device/list` 这种路径必须 fallback 到 `index.html`，否则刷新会 404。

### 11.3 部署后访问问题

- 天行 API 代理只在 dev 模式生效，**生产环境需要服务端代理**
- 或者直接请求 `https://apis.tianapi.com/...`（会跨域，需要天行后台配置 CORS 白名单）

---

## 12. Git & GitHub

### 12.1 仓库

- GitHub：`https://github.com/At210Co60/smart-factory-ops.git`
- 可见性：公开
- 分支：`main`（已从 master 改名）

### 12.2 提交历史

| Commit | 说明 |
|---|---|
| `7c3ff47` | Day3 完整交付 — Axios 环境 + Dashboard + mock 数据 + 4 个业务页面 + API 封装 + 设备筛选 + ECharts 环形图 |
| `84b784f` | docs: 详尽 README + .env.example 模板 |
| `d402f51` | Day4 数据面板 — countBy 工具 + 4 张项目图表 2×2 集成 + TypePie 教学练习 |

### 12.3 远程认证

当前使用 PAT（Personal Access Token）通过 `https://oauth2:<PAT>@github.com/...` 形式认证，已配置在 `.git/config` 的 origin。

**接手后建议**：撤销当前 PAT（之前在对话里明文贴过），换用 SSH key 或新 PAT。

---

## 13. 已完成清单

### 13.1 Day3（8 步）

- ✅ 步骤 1：环境（Axios 1.20.0 + .env.development + vite 代理）
- ✅ 步骤 2：Dashboard 实时天气（4 卡 + 6 信息行 + tips + 三态 + localStorage）
- ✅ 步骤 3：mock 数据基石（24 设备 + 12 工单 + 4 字典）
- ✅ 步骤 4：设备台账（搜索 + 分页 + 状态标签）
- ✅ 步骤 5：设备详情（基本信息 + 维护时间轴 + 创建工单入口）
- ✅ 步骤 6：工单列表（三页签 + 角标 + 流转 + 确认弹框）
- ✅ 步骤 7：创建工单（选设备 + 校验 + 优先级 + 自动编号）
- ✅ 步骤 8：Dashboard 指标卡（设备总数 + 待处理工单）

### 13.2 Day3 延伸任务

- ✅ 任务 1：API 封装（自动补 key + 判 code + AbortController 取消 + 15s 超时）
- ✅ 任务 2：设备台账加类型/状态筛选
- ✅ 任务 3：ECharts 设备类型环形图
- ✅ 任务 4：git 初始化 + 推送到 GitHub

### 13.3 Day4（数据面板）

- ✅ `src/utils/stats.ts` countBy 工具函数
- ✅ Dashboard 4 张图 2×2 集成（类型环形 + 状态饼图 + 车间柱状图 + 优先级柱状图）
- ✅ 工单优先级分布柱状图（用 loadOrders() 取活数据）
- ✅ `src/views/dashboard/TypePie.vue` 教学练习组件（未接入路由）

### 13.4 工程化

- ✅ 详尽 README.md（17.7 KB）
- ✅ .env.example 模板
- ✅ .gitignore 完整
- ✅ vue-tsc 类型检查通过
- ✅ vite build 通过
- ✅ 推送 GitHub 公开仓库

---

## 14. 已知问题

### 14.1 构建警告（不是错误）

```
dist/assets/home-BbFwUakG.js  1,175.98 kB │ gzip: 392.48 kB
(!) Some chunks are larger than 500 kB after minification.
```

**原因**：ECharts 全量引入（1.17 MB），Dashboard 的 4 张图都依赖它。

**解决方向**（如果后续要优化）：
- 用 `import * as echarts from 'echarts/core'` 按需引入
- 加 `import { BarChart, LineChart, PieChart } from 'echarts/charts'`
- 加 `import { CanvasRenderer } from 'echarts/renderers'`
- 可减少到 ~300 KB

当前未处理是因为项目周期紧 + 不影响功能。

### 14.2 功能限制

- **无真实后端**：所有数据是 mock + localStorage，刷新数据保留但不能跨设备同步
- **无用户体系**：登录态是 localStorage 假数据，刷新可保留但不能跨设备
- **无权限控制**：登录后所有用户看到一样的数据
- **天气 API 限额**：天行免费版每天有调用次数限制

### 14.3 浏览器兼容

- 依赖 `AbortController`（Chrome 66+ / Firefox 57+ / Safari 11.1+），不支持 IE
- 依赖 `localStorage`（所有现代浏览器，但隐私模式可能被禁用）

---

## 15. 扩展建议

按优先级排序，从易到难：

### 15.1 短期（1-2 天）

- **设备维护工单关联**：在设备详情页显示该设备的所有历史工单
- **工单详情页**：点工单号跳详情，单独看描述、操作日志、处理人
- **设备搜索增强**：支持按车间筛选、按状态筛选的复合搜索
- **Dashboard 添加更多指标**：工单处理时长、设备故障率 Top5

### 15.2 中期（3-7 天）

- **真实后端接入**：用 Express / Fastify / NestJS 起一个简单后端，对接 MySQL / PostgreSQL
- **用户体系**：JWT 登录、注册校验、密码加密（bcrypt）
- **权限控制**：普通员工只能看/创建；管理员才能删除/修改
- **TypeScript 进阶**：把 mock data 改成 API client 类型
- **ECharts 按需引入**：解决 chunk size 警告

### 15.3 长期（7+ 天）

- **PWA**：支持离线访问、安装到桌面
- **国际化 i18n**：用 vue-i18n 支持中英切换
- **单元测试**：Vitest + Vue Test Utils
- **E2E 测试**：Playwright
- **CI/CD**：GitHub Actions 自动跑测试 + 自动发布
- **监控**：Sentry 错误上报

---

## 16. 注意事项

### 16.1 接手前必读

1. **Node.js 版本**：项目用 Vite 8 + TypeScript 6，建议 Node.js 20 LTS
2. **天行 key**：自己申请一个，不要用旧的（如果还在用之前的，明文贴过对话）
3. **GitHub PAT**：之前在对话里明文贴过，建议立即撤销（https://github.com/settings/tokens）

### 16.2 提交规范

- commit message 用 `feat:` / `fix:` / `docs:` / `refactor:` 前缀
- 一次 commit 一个功能点，不要大杂烩
- 改 mock data 也算 feat（虽然只是数据）
- 不要 commit .env 文件！(已被 .gitignore 保护)

### 16.3 调试技巧

- **本地存储查看**：浏览器 DevTools → Application → Local Storage → `http://localhost:8080`
- **清空数据**：控制台执行 `localStorage.clear()` 然后刷新
- **ECharts 调试**：`chart.getOption()` 在控制台查看当前配置
- **路由调试**：`router.currentRoute.value` 查看当前路由

### 16.4 提交前自检

```bash
# 1. 类型检查
npm run build

# 2. 看 dist 产物
ls -la dist/

# 3. 检查 .gitignore 生效
git status

# 4. 启动 dev server 跑一遍
npm run dev
```

---

## 附录：核心文件行数速查

| 文件 | 行数 | 作用 |
|---|---|---|
| `src/api/index.ts` | ~110 | axios 封装 |
| `src/mock/data.ts` | ~147 | 24 设备 + 12 工单 + 字典 |
| `src/router/index.ts` | ~71 | 路由 + 守卫 |
| `src/utils/stats.ts` | ~16 | countBy 工具 |
| `src/views/home/index.vue` | ~675 | Dashboard（天气 + 4 张图 + 指标） |
| `src/views/device/list.vue` | ~280 | 设备台账 |
| `src/views/device/detail.vue` | ~310 | 设备详情 |
| `src/views/order/list.vue` | ~390 | 工单列表 |
| `src/views/order/create.vue` | ~360 | 创建工单 |
| `vite.config.ts` | ~26 | Vite 配置 |

---

**文档版本**：v1.0  
**最后更新**：2026-10-15  
**对应项目版本**：Day3 + Day4（commit d402f51）