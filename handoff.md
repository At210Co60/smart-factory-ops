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

**智能工厂设备运维管理平台** 是一个面向中小型工厂的设备全生命周期管理 Web 应用，把运维闭环做完整：**台账 → 计划 → 执行 → 物料 → 统计**。

- **设备台账**：24 台设备的只读档案 + 类型/状态/车间筛选 + 详情查看（含关联备件）
- **维护计划**：8 条种子计划，按 **下次维护日期现算**逾期/即将到期，完成即按周期顺延
- **工单管理**：12 条种子工单 + 新建工单 + 状态流转（待处理 → 处理中 → 已完成）+ **操作日志留痕**
- **备件库存**：6 种备件 + 出入库流水 + 低库存告警，按设备类型关联
- **数据看板**：实时天气（含离线兜底）+ 3 张 KPI 指标卡 + 4 张分布图 + 14 天工单趋势 + 故障工单排行

### 1.2 移交信息

- **项目根目录**：`C:\Users\戴达\Desktop\smart-factory-ops`（原机器为 `C:\Users\15271\Desktop\web-project`）
- **GitHub**：`https://github.com/At210Co60/smart-factory-ops.git` （公开仓库）
- **主分支**：`main`
- **当前版本**：Day3 + Day4 + 后续迭代（工单详情 / 维护计划 / 备件库存 / 首页洞察 / 离线兜底）
- **本地运行入口**：`http://localhost:8080`（vite 端口固定 8080；若被占用会自动跳到 8081）
- **环境变量**：`.env.development` 不进版本库，换电脑需按 `.env.example` 自行创建；**不配 key 也能跑**（首页走离线演示数据）

### 1.3 项目能干什么（用户视角）

- **运维人员**：登录 → 看看板 → 找设备 → 看详情（顺带确认备件够不够）→ 创建工单 → 处理 → 完成，每一步都留痕
- **设备管理员**：维护计划页看"接下来该保养谁"，逾期/即将到期排在前面，点「完成本次」自动顺延
- **库管/采购**：备件库存页看缺货与低库存告警，做出入库并留下流水
- **主管**：看看板的运行率/待处理/完成率，以及近 14 天工单趋势与故障工单排行

---

## 1.5 项目成员名单

> ⚠️ **待补充**：带「请填写」的行需要本人姓名替换后，本文档才算最终版。
> 格式统一用「姓名（负责内容）」，方便宣传组直接抄进 PPT 尾页。

| 角色 | 成员 | 负责内容 |
|---|---|---|
| 开发 | At210Co60 | 项目框架搭建、Axios 封装、设备台账/详情、工单列表/创建、ECharts 集成 |
| 开发 | 请填写 | 工单详情与操作日志、维护计划模块、备件库存模块、首页洞察区、离线演示兜底 |
| 宣传制作 | 请填写 | PPT 制作、功能演示视频、项目宣传文案 |
| 指导/评审 | 请填写 | 需求评审、演示验收 |

**开发分工说明（给宣传组参考，可据此写"分工明确"那页）**：

- 第一批（Day3–Day4）：基础框架 + API 封装 + 设备与工单两大主线，共 8 个页面
- 第二批（后续迭代）：在原有两条主线基础上补齐**预防性维护（维护计划）**与**维修物料（备件库存）**两个模块，并把工单详情、首页洞察、离线演示兜底补上
- 两批共同点：数据结构统一（localStorage + 种子数据 + 派生状态），代码风格统一（`<script setup>` + scoped CSS + 无 UI 组件库）

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
│   ├── layouts/                 # 布局组件
│   │   └── BasicLayout.vue      # 登录后的外壳（左侧菜单 + 顶部栏）
│   ├── mock/                    # 模拟数据（前端 mock，不是真实后端）
│   │   ├── data.ts              # 24 设备 + 12 工单 + 操作日志 + 字典/存储工具
│   │   ├── plans.ts             # 维护计划：种子 + 日期状态推导 + 完成顺延
│   │   └── spares.ts            # 备件库存：种子 + 出入库 + 库存状态推导
│   ├── router/
│   │   └── index.ts             # 路由表 + 登录态守卫 + 兜底路由
│   ├── utils/                   # 工具函数
│   │   ├── stats.ts             # countBy 分组统计
│   │   ├── format.ts            # 时间/日期格式化 + 当前登录账号
│   │   └── charts.ts            # ECharts init/尺寸联动/销毁
│   ├── views/                   # 页面组件
│   │   ├── home/                # 数据看板（天气 + 指标 + 5 张图 + 故障排行）
│   │   ├── device/              # 设备模块
│   │   │   ├── list.vue         # 设备台账
│   │   │   └── detail.vue       # 设备详情（含关联备件）
│   │   ├── plan/
│   │   │   └── list.vue         # 维护计划
│   │   ├── spare/
│   │   │   └── list.vue         # 备件库存
│   │   ├── order/               # 工单模块
│   │   │   ├── list.vue         # 工单列表
│   │   │   ├── detail.vue       # 工单详情（操作日志时间轴）
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
├── README.md                    # 项目介绍
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

页面从上到下分 6 大块：

**① 实时天气区**（基于天行数据 API）
- 4 张数据卡：城市 / 天气 / 实时气温 / 相对湿度
- 6 行信息列表：最高气温 / 最低气温 / 风向风力 / 空气质量(AQI) / 日期 / 星期
- 温馨提示块（tips，没数据时不渲染）
- 城市切换框（输入城市名按回车或点刷新）
- **localStorage 记忆城市**（`fop_weather_city_v1`），下次打开自动恢复
- **三态处理**：loading / error / empty
- **离线演示兜底**：没配 key（空值或模板占位符）时**不发请求**，直接用确定性算法生成天气数据并显示「离线演示」提示条；key 失效或断网时同样降级。演示环境不依赖网络和 key

**② 关键指标卡（3 张，实时计算）**
- 设备运行率：运行中台数 / 24（现算比率）
- 待处理工单：`loadOrders()` 中待处理数量
- 工单完成率：已完成 / 工单总数（现算比率）

**③ 4 张 ECharts 分布图**（2×2 网格）
| 位置 | 标题 | 类型 | 数据源 |
|---|---|---|---|
| 左上 | 设备类型分布 | 环形图 | `DEVICES` 类型字段 |
| 右上 | 设备状态分布 | 饼图 | `DEVICES.status` → 标签 |
| 左下 | 各车间设备数量 | 柱状图 | `DEVICES.shop` |
| 右下 | 工单优先级分布 | 柱状图 | `loadOrders()` 优先级字段 |

**④ 运维洞察区**
- **近 14 天工单创建趋势**：面积折线图，按 `createTime` 的日期分组（标题下带统计口径说明）
- **故障工单排行**：按设备聚合工单数取前 8，带进度条、设备当前状态标签、最近工单时间

**⑤ 工程化**：
- 5 张图的 init / 尺寸联动 / 销毁统一交给 `src/utils/charts.ts` 的 `mountCharts()`
- 尺寸变化用 **ResizeObserver 盯容器**，而不是只听 `window.resize`——响应式断点把两列折成一列时窗口没变，只监听 window 会导致图表保持旧宽度、把页面撑出横向滚动条
- 初始化必须在 `onMounted`（DOM 渲染完才能拿到容器），销毁在 `onUnmounted`

#### 实现要点

- API 调用：`request.get('/tianapi/tianqi/index', { params: { city, type: 1 } })`
- 不需要传 key：拦截器自动注入 `VITE_TIANAPI_KEY`
- 业务错误（非 200 code）：拦截器自动 reject，业务代码直接 `catch(e => e.message)`
- 切换城市时上一次未完成请求自动 abort：拦截器用 AbortController 实现
- **请求序号防串台**：`loadSeq` 递增，只有最后一次请求能收尾（关 loading / 写兜底数据），避免快速切城市时旧响应盖掉新结果

#### 文件位置

- `src/views/home/index.vue`（含 5 张图的 option 构建）

---

### 4.3 设备台账（`/device/list`）

#### 能干什么

- **搜索框**：按设备名称 / 编号 / 型号 / 车间搜索，350ms 防抖
- **类型筛选下拉**：数控机床 / 注塑机 / 工业机器人 / 动力设备 / 检测设备 + "全部"
- **状态筛选下拉**：运行 / 故障 / 停机 / 维护中 + "全部"
- **三条件叠加**：搜索框 + 类型 + 状态用 Vue computed 联动
- **设备列表**：表格展示（编号、名称、类型、车间、负责人、状态、操作）
- **状态标签**：彩色 chip（运行=绿 / 故障=红 / 停机=灰 / 维护中=橙）
- **分页**：每页 5/10/20 可选，切筛选或每页条数都回第 1 页
- **操作列**：点"详情"跳 `/device/detail/:id`

#### 实现要点

- 数据源：`DEVICES`（24 条固定数组）
- 筛选：`computed(() => DEVICES.filter(...))` 链式组合
- 防抖：`setTimeout + ref` 实现 350ms 防抖
- 状态颜色：`DEVICE_STATUS[d.status].color` 映射到 CSS class

#### 文件位置

- `src/views/device/list.vue`

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
- **关联备件卡**（新增）：
  - 按设备类型反查备件库（`sparesForDeviceType`），列出该机型常用备件
  - 每项显示名称、库存数量、单位、规格、库位、库存状态标签
  - 缺货/低库存会标红并在卡片头部提示"X 种缺货或低库存"，可一键跳 `/spare/list`
- **操作按钮区**：
  - 「返回台账」：跳 `/device/list`
  - 「为此设备创建工单」：跳 `/order/create?deviceId=EQ-XXXX`

#### 实现要点

- 路由参数：`useRoute().params.id` 拿设备编号
- 找不到设备：显示「设备不存在」+ 返回按钮
- 创建工单跳转带 `?deviceId=` 让创建页预选设备
- **最近保养跨模块联动**：优先读维护计划里该设备最近一次 `lastDate`（`latestMaintenanceOf`），没有计划记录才回落到台账自带的 `lastMaint`。所以在维护计划页点过「完成本次」后，这个日期会跟着更新

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
  - 工单号（`WO-YYMMDDNNN` 格式，**可点击进详情**）
  - 关联设备（编号 + 名称）
  - 故障描述
  - 优先级标签（高=红 / 中=橙 / 低=绿）
  - 状态标签（待处理=橙 / 处理中=蓝 / 已完成=绿）
  - 时间列（**随页签变化**：待处理/处理中显示创建时间，已完成显示完成时间）
  - 操作（不同页签不同按钮 + 「详情」）
- **状态流转**：
  - 待处理页签：操作列显示「开始处理」按钮
  - 处理中页签：操作列显示「标记完成」按钮
  - 已完成页签：操作列显示「查看设备」
- **确认弹框**：半透明背景 + 取消/确认按钮（防误操作）
- **空状态**：某页签没有数据时显示「暂无该状态的工单」

#### 实现要点

- 数据源：`loadOrders()` 从 localStorage 读
- 流转操作：统一调 `transitionOrder(list, no, to)`，**改状态 + 追加操作日志 + 持久化**一步完成（这样工单详情页的时间轴才有内容）
- 页签切换：`computed` 过滤
- 弹框：`v-if` 控制可见性

#### 文件位置

- `src/views/order/list.vue`

---

### 4.6 工单详情（`/order/detail/:no`）

#### 能干什么

- **入口**：工单列表点工单编号，或操作列点「详情」
- **顶部栏**：返回按钮 + 工单号（等宽字体）+ 状态标签 + 优先级标签；右侧按状态给出「开始处理」/「标记完成」/「查看关联设备」
- **工单信息卡（左）**：
  - 故障描述**整段展示**（列表里被省略号截断的内容在这里能看全）
  - 关联设备（可点击跳设备详情）、设备编号、优先级、状态、创建时间、完成时间
- **操作日志卡（右）**：竖向时间轴
  - 创建工单（灰点）→ 开始处理（蓝点）→ 完成工单（绿点）
  - 每条含：动作名、时间、说明、操作人
  - 操作人取自登录账号（读不到兜底「系统管理员」）
- **本页流转**：确认后**停在本页**，时间轴立刻新增一条，演示时比跳回列表更直观
- **编号无效兜底**：整页空状态「工单不存在或未选择工单」+ 返回按钮

#### 实现要点

- 路由参数：`useRoute().params.no`
- 数据：`loadOrders()` 后在内存里找；每次流转后重新赋值，保证页面与 localStorage 一致
- **日志只增不改**：由 `transitionOrder()` 统一写入，页面不自己拼日志
- **老数据自动迁移**：`loadOrders()` 里 `migrateOrders()` 会给缺少 `opLog` 的历史工单按创建/完成时间补出日志并写回，用户不用清缓存

#### 文件位置

- `src/views/order/detail.vue`

---

### 4.7 维护计划（`/plan/list`）

#### 能干什么

- **顶部汇总卡**：计划总数 / 已逾期 / 7 天内到期 / 已停用
- **列表排序**：按紧迫度自动排序（逾期 → 即将到期 → 正常 → 已停用）
- **状态与倒计时**：状态标签 + 倒计时文案（「已逾期 3 天」/「还有 2 天」/「今天到期」）
- **筛选**：关键字（设备名/编号/维护内容/负责人）+ 状态 + 维护类型（例行保养/巡检/点检/大修）
- **完成本次**：确认后记录本次日期，并按周期顺延下次日期
  - **逾期的从"今天"起算**，否则一完成又会立刻变成逾期
- **停用 / 启用**：停用后不参与到期判断，行置灰
- **新增 / 编辑**：弹窗表单
  - 选设备自动带出设备名称与负责人
  - 维护周期用预设 chip（7/15/30/60/90/180/365 天）一点即选，新建时会顺带把下次日期设成"今天 + 周期"
  - 原生 `date` 输入框选下次维护日期
- **删除**：带确认弹框

#### 实现要点

- 数据源：`loadPlans()` → localStorage `fop_plans_v1`，首次访问写入 8 条种子
- **状态不落库**：`planStatus(p)` 按 `nextDate` 与今天现算（`paused` 优先 → 已逾期 → 7 天内到期 → 正常），所以不需要有人每天改数据
- 完成顺延：`completePlan()` 取 `nextDate` 与今天的较大者，再加 `cycleDays`
- 编号生成：`nextPlanId()` 扫现有最大号 +1

#### 文件位置

- `src/mock/plans.ts`（数据层）/ `src/views/plan/list.vue`（页面）

---

### 4.8 备件库存（`/spare/list`）

#### 能干什么

- **顶部汇总卡**：备件种类 / 缺货 / 低于安全库存 / 库存正常
- **补货提醒条**：有缺货或低库存时自动出现（琥珀色，是提醒不是报错）
- **列表排序**：缺货排最前，其次低库存；库存数字在异常时标红
- **入库 / 出库**：弹窗填数量与备注
  - **出库超过现有库存会被拒绝**并提示「库存不足:现有 N 支」，不会写出负库存
- **出入库流水**：点备件名称查看完整流水（入/出、数量、时间、经办人、用途备注）
- **新增 / 编辑备件**：编号自动生成（`SP-00X`）
  - **库存数量只能走出入库**：编辑时该字段锁定，避免绕过流水改账
  - 新增时若填了期初库存，会自动记一条「期初入库」流水

#### 实现要点

- 数据源：`loadSpares()` → localStorage `fop_spares_v1`，首次访问写入 6 条种子
- **库存状态不落库**：`spareStatus(s)` 现算（`qty <= 0` 缺货 / 低于 `safetyStock` 低库存 / 其余正常）
- 出入库统一走 `moveSpare()`，校验 + 改数量 + 追加流水 + 持久化一步完成
- 每个备件挂在 `deviceType` 下，设备详情页据此反查

#### 文件位置

- `src/mock/spares.ts`（数据层）/ `src/views/spare/list.vue`（页面）

---

## 4A. 新模块宣传素材（给宣传组）

> 本章是**专给 PPT / 演示视频 / 宣传文案**准备的：每个新模块的痛点、价值、功能清单、卖点话术，外加一份完整的演示脚本。
> 可以直接照抄进 PPT，也可以按"演示脚本"走一遍录视频。

### 4A.1 为什么加这两个模块（讲给评委/听众听的故事线）

原有系统解决的是**事后维修**：设备坏了 → 建工单 → 处理 → 完成，再加一个看板做统计。
但真实工厂的运维还缺两块，这正是本次迭代补上的：

| 缺什么 | 后果（痛点） | 我们补的模块 |
|---|---|---|
| 没有**预防性维护** | 只能等设备坏，停机损失大，保养全靠人记 | **维护计划**：到点就保养，逾期自动预警 |
| 没有**备件管理** | 工单派下去才发现"没件可换"，维修等料干着急 | **备件库存**：缺货/低库存告警，出入库有流水 |

**一句话总结（适合做 PPT 过渡页大字）**：

> 从"坏了才修"到"到点就保养、有件可换"——我们把设备运维的闭环补完整了。

### 4A.2 新模块一：维护计划

| 项目 | 内容 |
|---|---|
| 一句话定位 | 给每台设备排保养班表，到期自动提醒，做完自动排下一次 |
| 解决的痛点 | 保养靠人记、逾期没人管、纸质台账查不动 |
| 核心价值 | 把**被动维修**变成**主动预防**，减少非计划停机 |

**功能明细（宣传组可逐条做 PPT 要点）**：

1. **顶部四张汇总卡**：计划总数 / 已逾期 / 7 天内到期 / 已停用——一屏看清整体状况
2. **自动排序**：逾期的排最前，其次即将到期、正常、已停用——**要处理的事永远在第一条**
3. **倒计时提醒**：每条显示"已逾期 3 天" / "还有 2 天" / "今天到期"，比单纯给个日期直观得多
4. **多维筛选**：关键字（设备名/编号/维护内容/负责人）+ 状态 + 维护类型（例行保养 / 巡检 / 点检 / 大修）
5. **完成即顺延**：点「完成本次」记录本次日期，并按周期自动算下次日期；**逾期项从今天起算**，避免一完成又立刻逾期
6. **停用 / 启用**：检修停机等场景可临时停用，不参与到期判断
7. **新建 / 编辑**：选设备自动带出名称与负责人；周期用预设芯片（7/15/30/60/90/180/365 天）一点即选

**演示高光时刻（务必在 PPT 或视频里放这一条）**：
在设备详情页的「最近保养」日期是三月前 —— 去维护计划页点「完成本次」—— 回到设备详情，**这个日期已经变成今天**。数据是打通的，不是各管各的静态页面。

**技术亮点（若 PPT 有"技术实现"页可讲）**：计划状态（逾期/即将到期）**不存数据库**，按下次维护日期**现算**，所以不需要有人每天去改数据，明天打开它自动就是新的状态。

### 4A.3 新模块二：备件库存

| 项目 | 内容 |
|---|---|
| 一句话定位 | 每个备件够不够、在哪、谁领的，一页查清 |
| 解决的痛点 | 维修卡在"没件可换"；库存靠感觉；领用无记录 |
| 核心价值 | 保障维修**有件可用**，账实相符，避免呆滞与断供 |

**功能明细**：

1. **顶部四张汇总卡**：备件种类 / 缺货 / 低于安全库存 / 库存正常
2. **补货提醒条**：有缺货或低库存时自动出现，明确写出"N 种已缺货，M 种低于安全库存，建议尽快采购"
3. **自动排序 + 标红**：缺货排最前，库存数字在异常时标红——**该补什么永远在第一眼**
4. **入库 / 出库**：弹窗填数量与备注（出库备注一般写流向，如"用于 WO-xxxx 维修"）
5. **超量出库拦截**：领 99 个但库里只有 0 个 → 直接拦住并提示"库存不足:现有 0 支"，**不会出现负库存**（这是个很好的健壮性演示点）
6. **出入库流水**：点备件名称看完整台账——入/出、数量、时间、经办人、用途，全程可追溯
7. **库存数量只能走出入库**：编辑备件时该字段锁定；新建填了期初数量，系统自动记一条"期初入库"——**账实相符**的设计

**演示高光时刻**：
随便挑一个缺货备件点「出库」输 99 个 → 系统拦住你（讲"不会出现负库存"）→ 改成「入库」补 5 个 → 状态从"缺货"变"低库存" → 点开流水，**刚才这笔记录连经办人和时间都在**。

**与设备模块的联动（第二个高光点）**：
打开设备详情页，底部「关联备件」卡会列出**这台设备用得上的备件**，缺货的直接标出来——派工前就知道有没有件，不用等维修师傅到了现场才发现。

### 4A.4 首页看板升级（顺带讲）

- **指标卡从 2 张升级为 3 张**：设备运行率（16/24 台 → 67%）、待处理工单、工单完成率——**比率比单看总数更能说明"厂子现在怎么样"**
- **新增「运维洞察」区**：
  - 近 14 天工单创建趋势（面积折线图，新建工单后这条线当天就会动）
  - 故障工单排行（按设备聚合工单数，带进度条 + 该设备当前状态，**谁最该管一目了然**）
- **天气真实接口 + 离线兜底**：演示时天气卡片是真实的实时数据；万一断网或没配 key，系统会自动切换成内置演示数据并明确标注"离线演示"，**不会出现红色报错**

### 4A.5 建议 PPT 结构（宣传组可直接采用）

| 页码 | 内容 | 备注 |
|---|---|---|
| 1 | 项目名 + 一句话定位 | 「智能工厂设备运维管理平台」 |
| 2 | 背景痛点 | 用 4A.1 的两行表格 |
| 3 | 系统全景 | 用 README 的模块图，或"台账→计划→执行→物料→统计"链路图 |
| 4-5 | 设备台账 + 设备详情 | 截图示意，重点讲"关联备件"卡片 |
| 6-7 | 工单流程 + 工单详情 | 重点讲"操作日志全程留痕" |
| 8-9 | **维护计划**（新） | 用 4A.2，突出"完成即顺延"和跨模块联动 |
| 10-11 | **备件库存**（新） | 用 4A.3，突出"超量拦截"和"流水可追溯" |
| 12 | 数据看板 | 用 4A.4，突出 3 张指标卡与两张洞察图 |
| 13 | 技术亮点 | Vue3 + TS + Axios 封装 + ECharts + localStorage 持久化 + 离线兜底 |
| 14 | 团队分工 | 用 1.5 的名单表 |
| 15 | 结语 | 建议回扣"从坏了才修到到点就保养、有件可换" |

### 4A.6 完整演示脚本（约 5 分钟，可按此录视频）

> 括号里是**讲解词**，其余是操作动作。

1. **登录**（演示账号 admin123 / 123456，或现场注册一个）
2. **数据看板**（"进来先看今天的整体情况：设备运行率 67%，5 单待处理，最近两周工单走势，以及故障最高的几台设备"）
3. **设备台账** → 搜"注塑机" → 筛选"故障"（"运维最常用的两个动作：找某台设备、看哪些设备出问题了"）
4. **点进一台设备详情**（"这里能看到设备的完整档案和三次维护记录——注意看，底部还有这台设备用得上的备件，其中一种是缺货的"）
5. **点「为此设备创建工单」**（"发现异常，直接就地建单，设备已经自动选好了"）
6. **填描述、选优先级、提交** → **工单列表**（"新单进待处理，切换页签看角标"）
7. **点工单编号进详情** → **点「开始处理」** → **再点「标记完成」**（"每一步操作都记在右侧日志里——谁、什么时候、做了什么，全程留痕"）
8. **维护计划**（"这是本次新增的第一个模块：保养班表。逾期的那条排在最前面，点完成，系统按周期自动排出下次时间"）
9. **切到设备详情**（"回到刚才那台设备，最近保养日期已经同步成今天了"）
10. **备件库存**（"第二个新模块。缺货的排最前，顶部直接提示补货"）→ **对缺货件点「出库」输 99** （"会被拦住，不会出现负库存"）→ **改入库 5 个** → **点开流水**（"这笔记录的经办人和时间都留档了"）
11. **回到看板**（"刚才的操作已经反映在数据里"）

### 4A.7 演示注意事项（宣传组录制前必看）

- **数据是活的**：刷新不会丢，但如果**清了浏览器缓存**（localStorage），工单/计划/备件会回到初始的种子数据。录视频前建议先清一次缓存，让数据回到干净状态
- **天气要真实数据**：需配好 `.env.development` 里的天行 key（见 §9）。没配也能演示，但天气卡会出现"离线演示"提示条——**如果 PPT 里写"实时天气"，录制前务必确认没有那根提示条**
- **每页都值得截图**：窗口宽度建议 1440px 以上，四张图表是 2×2 布局；窄屏会自动堆叠成单列（可另做一张手机端适配的对比图）
- **两个最上镜的操作**：维护计划页的「完成本次」→ 设备详情日期变化；备件出库超量被拦截。这两个动作有"反馈"，最适合录进视频
- **不要演示的操作**：删除计划、删除备件这类破坏性操作（录进视频不好看，也没必要）

---

### 4.9 创建工单（`/order/create`）

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
- **工单号自动生成**：`WO-YYMMDDNNN` 格式（年份两位，与 12 条种子数据保持一致）
  - 日期为当天（YYMMDD）
  - NNN 为当日已有最大序号 + 1（3 位补零）
- **提交按钮**：
  - 校验失败禁用
  - 校验通过可点击
  - 提交后跳 `/order/list` 并刷新

#### 实现要点

- 数据源：选设备从 `DEVICES` 过滤
- 校验：computed 实时算 `isValid`
- 自动编号：扫 `loadOrders()` 里当天前缀的最大序号 +1
- 提交：新工单插入列表最前面，并写入**第一条操作日志**（创建工单 + 当前账号）

#### 文件位置

- `src/views/order/create.vue`

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
interface OrderLogEntry {
  status: 'pending' | 'processing' | 'done' // 产生这条日志时的工单状态
  label: string        // 中文动作名:创建工单 / 开始处理 / 完成工单
  time: string         // YYYY-MM-DD HH:mm
  operator: string     // 操作人(取自登录账号,读不到兜底「系统管理员」)
  note: string         // 说明文案
}

interface WorkOrder {
  no: string           // 工单号 WO-YYMMDDNNN(年份两位,与种子数据一致)
  deviceId: string     // 关联设备编号
  deviceName: string   // 设备名称(冗余存储,显示不用再回查)
  desc: string         // 故障描述(5-500 字)
  priority: 'high' | 'mid' | 'low'   // 优先级
  status: 'pending' | 'processing' | 'done'  // 状态
  createTime: string   // 创建时间 YYYY-MM-DD HH:mm
  finishTime: string   // 完成时间(已完成工单填,其他空字符串)
  opLog: OrderLogEntry[] // 操作日志(按时间正序),工单详情页时间轴的数据源
}
```

**种子工单**：12 条（待处理 5 / 处理中 3 / 已完成 4），全部集中在 `2026-10-13` 一天。
**老数据迁移**：`loadOrders()` 里的 `migrateOrders()` 会给缺少 `opLog` 的历史工单按创建/完成时间补出日志并写回。

### 5.3 维护计划（MaintenancePlan）

```typescript
interface MaintenancePlan {
  id: string          // 计划编号 MP-001
  deviceId: string    // 关联设备编号
  deviceName: string  // 设备名称(冗余)
  type: PlanType      // '例行保养' | '巡检' | '点检' | '大修'
  content: string     // 维护内容
  cycleDays: number   // 周期(天)
  nextDate: string    // 下次维护日期 YYYY-MM-DD
  lastDate: string    // 上次维护日期(没做过为空字符串)
  owner: string       // 负责人
  paused: boolean     // 是否停用
  createdAt: string   // 创建时间
}
```

**派生状态**（`planStatus()` 现算，不落库）：`paused` 优先 → 已逾期（`nextDate < 今天`）→ 即将到期（≤7 天）→ 正常。
**种子**：8 条，含 1 条已逾期、2 条即将到期（演示时三种状态都能看到）。

### 5.4 备件（SparePart）

```typescript
interface SpareMovement {
  type: 'in' | 'out'   // 入库 / 出库
  qty: number
  time: string         // YYYY-MM-DD HH:mm
  operator: string     // 经办人
  note: string         // 备注(出库一般写流向,如工单号)
}

interface SparePart {
  code: string         // 备件编号 SP-001
  name: string         // 备件名称
  spec: string         // 规格型号
  deviceType: string   // 适配设备类型(对应 DEVICES.type)
  qty: number          // 当前库存
  safetyStock: number  // 安全库存
  unit: string         // 单位
  location: string     // 库位
  movements: SpareMovement[] // 出入库流水(按时间正序)
}
```

**派生状态**（`spareStatus()` 现算，不落库）：`qty <= 0` → 缺货 / 低于 `safetyStock` → 低库存 / 其余正常。
**种子**：6 条，含 1 条缺货、1 条低库存。

### 5.5 字典（Dictionary）

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

### 5.6 localStorage 键

| Key | 类型 | 说明 |
|---|---|---|
| `fop_auth_v1` | JSON | 登录态 `{user, loginAt}` |
| `fop_orders_v1` | JSON | 工单数组（活数据，可增删改，含操作日志） |
| `fop_plans_v1` | JSON | 维护计划数组（懒加载：首次打开维护计划页才写入种子） |
| `fop_spares_v1` | JSON | 备件数组（懒加载：首次打开备件库存页才写入种子） |
| `fop_weather_city_v1` | string | 上次查询的天气城市 |

清空 localStorage = 工单/计划/备件全部回到种子数据、要求重新登录、天气重置为福州。

---

## 6. API 封装

文件位置：`src/api/index.ts`

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
| **自动补 key** | 请求拦截器读 `import.meta.env.VITE_TIANAPI_KEY` 自动注入 params.key（**没配就跳过注入**，由页面走离线兜底） | 业务代码不需要关心 key |
| **自动判 code** | 响应拦截器判 `res.data.code !== 200` 直接 reject | 业务代码不需要重复判 `if (res.code !== 200)` |
| **AbortController 自动取消** | 拦截器用 `method + url` 当 key，相同请求来一遍自动 abort 上一次 | 用户快速切换城市时上一次请求不会污染数据 |
| **静默取消** | AbortController 抛的错标记 `err.silent = true` | 业务代码可以选择不显示取消错误给用户 |

### 6.3 controller 身份比对（防误删）

`_controller` 挂在 config 上，响应/错误回调只摘掉**属于自己**的 controller：

```typescript
function releaseController(config) {
  const key = getRequestKey(config)
  if (pendingControllers.get(key) === config._controller) {
    pendingControllers.delete(key)
  }
}
```

**为什么不能按 key 无脑删**：同 key 的新请求 B 发出时会覆盖 map 里的 controller，此时旧请求 A 的回调如果还按 key 删，删掉的就是 B 的 —— B 从此不可取消，后续请求的 abort 会落空。表现为"连按两次回车切城市，后一次请求被静默取消，看板留着旧城市数据且不报错"，很隐蔽。

### 6.4 业务代码模板

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
| `/plan/list` | `views/plan/list.vue` | 维护计划 | ✅ |
| `/spare/list` | `views/spare/list.vue` | 备件库存 | ✅ |
| `/order/list` | `views/order/list.vue` | 工单管理 | ✅ |
| `/order/detail/:no` | `views/order/detail.vue` | 工单详情 | ✅ |
| `/order/create` | `views/order/create.vue` | 创建工单 | ✅ |

注：根路径 `/` 重定向到 `/login`，登录后守卫跳 `/home`。
**兜底路由**：`{ path: ':pathMatch(.*)*', redirect: '/home' }`——地址写错或指向已删除的页面时不会停在空白页（只剩侧栏和顶栏）。

### 7.2 守卫逻辑

```typescript
router.beforeEach((to) => {
  const auth = localStorage.getItem('fop_auth_v1')
  if (to.meta.requiresAuth && !auth) return '/login'
  if (to.path === '/login' && auth) return '/home'
  document.title = (to.meta.title as string) || '智能工厂设备运维管理平台'
})
```

### 7.3 侧边菜单高亮

菜单高亮**不依赖** RouterLink 的 `router-link-active`，而是按模块前缀现算：

```typescript
const menus = [
  { path: '/home',        label: '数据看板', match: ['/home'] },
  { path: '/device/list', label: '设备台账', match: ['/device'] },
  { path: '/plan/list',   label: '维护计划', match: ['/plan'] },
  { path: '/spare/list',  label: '备件库存', match: ['/spare'] },
  { path: '/order/create',label: '创建工单', match: ['/order/create'] },
  { path: '/order/list',  label: '工单管理', match: ['/order'] },
]

function isMenuActive(item) {
  return item.match.some((m) => new RegExp(`^${m}(/|$)`).test(route.path))
}
```

**为什么要自己算**：详情页和列表页在路由表里是**兄弟节点**（`/order/list` 与 `/order/detail/:no`），Vue Router 内置的 active 判断只在"同一路由记录"时成立，所以在工单详情页里「工单管理」不会亮。按模块前缀匹配才是符合直觉的行为。
**注意顺序**：`/order/create` 必须排在 `/order/list` 前面，否则会被 `/order` 这个更宽的前缀截胡。

---

## 8. 工具函数

三个文件都在 `src/utils/`。

### 8.1 stats.ts — countBy

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

看板上的状态/车间/优先级三张图都依赖它。

### 8.2 format.ts — 时间与账号

| 函数 | 作用 |
|---|---|
| `nowStr()` | 当前时间 `YYYY-MM-DD HH:mm` |
| `formatDateTime(d)` / `formatDate(d)` | Date → 字符串 |
| `todayStr()` | 今天 `YYYY-MM-DD` |
| `dateAfterDays(n)` | 今天 ± n 天（维护计划种子与周期预设用） |
| `daysBetween(a, b)` | 两个日期相差几天 |
| `dateOf(s)` | 从 `YYYY-MM-DD HH:mm` 截出日期部分 |
| `currentUser()` | 当前登录账号，读不到兜底「系统管理员」（操作日志/出入库经办人） |

原本工单列表和创建页各写了一份时间格式化，统一收口到这里。

### 8.3 charts.ts — 图表生命周期

```typescript
const charts = mountCharts([
  { ref: chartEl, option: buildOption() },
  ...
])
```

**做了什么**：批量 `echarts.init` + `setOption`，用 **ResizeObserver 盯容器**做尺寸联动，组件卸载时在 `onUnmounted` 里 `dispose`。

**为什么用 ResizeObserver 而不是 `window.resize`**：窗口尺寸没变、但布局变了（响应式断点把两列折成一列、侧栏收窄）时 `window.resize` 不触发，图表会保持旧宽度把页面撑出横向滚动条。盯容器两种场景都能覆盖。

---

## 9. 本地开发

### 9.1 必备环境

- Node.js 18+（建议 20 LTS）
- npm 9+ 或 pnpm
- 天行数据 API key（https://www.tianapi.com/ 注册免费拿）——**可选**，不配就走离线演示数据

### 9.2 启动步骤

```bash
# 1. 克隆仓库
git clone https://github.com/At210Co60/smart-factory-ops.git
cd smart-factory-ops

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选）
# 在项目根目录创建 .env.development，写入：
#   VITE_APP_NAME=智能工厂设备运维管理平台
#   VITE_TIANAPI_KEY=你的天行数据key
# 不配也能跑：首页天气会自动使用离线演示数据并显示提示条

# 4. 启动开发服务器
npm run dev
# 默认跑在 http://localhost:8080（被占用会自动换端口，注意看终端输出）

# 5. 浏览器打开
# 访问 http://localhost:8080/login
# 用演示账号 admin123 / 123456 登录，或注册任意账号 → 自动登录 → 进入数据看板
```

### 9.3 常用脚本

```bash
npm run dev       # 启动 dev server（端口 8080）
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览构建产物（端口 4173）
```

---

## 10. 环境变量

### 10.1 变量说明

| 变量 | 必需 | 说明 | 示例 |
|---|---|---|---|
| `VITE_APP_NAME` | 否 | 侧栏顶部显示的平台名，不配用默认值 | 智能工厂设备运维管理平台 |
| `VITE_TIANAPI_KEY` | 否 | 天行数据 API key；留空/占位符则首页走离线演示数据 | `abcd1234...` |

**三种填法**（对应看板天气的三种表现）：

1. 留空或保持 `your_key_here`：**不发网络请求**，直接用内置演示数据 + 顶部「离线演示」提示条
2. 填真实 key：走天行实时接口，无提示条
3. key 失效/额度用尽：自动降级为演示数据，提示条注明原因

演示（断网、没账号、key 过期）都不会出现红色报错。

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

### 13.4 后续迭代（本次交付）

- ✅ **首页天气离线演示兜底**：没配 key / key 失效 / 断网时自动降级为确定性演示数据 + 琥珀色提示条，演示不再出现红色报错
- ✅ **工单详情页**（`/order/detail/:no`）：工单全貌 + 操作日志时间轴 + 本页流转；`WorkOrder` 新增 `opLog` 字段，老数据自动迁移
- ✅ **维护计划模块**（`/plan/list`）：8 条种子计划，状态按日期现算，完成即顺延，支持停用/编辑/删除
- ✅ **备件库存模块**（`/spare/list`）：6 条种子备件，出入库流水，出库超量拦截，低库存告警
- ✅ **跨模块联动**：设备详情新增「关联备件」卡（按设备类型反查）；「最近保养」优先读维护计划的完成记录
- ✅ **首页运维洞察**：新增近 14 天工单趋势 + 故障工单排行；指标卡升级为运行率/待处理/完成率
- ✅ **去掉数据看板重复页**：曾做过一个独立「数据分析」页，因与首页分布图功能重叠而移除，只把它独有的趋势与排行并入首页（少一个页面，洞察不丢）
- ✅ **兜底路由**：地址写错或指向已删页面时送回首页，不再出现空白页
- ✅ **公共工具收口**：`utils/format.ts`（时间/账号）、`utils/charts.ts`（图表生命周期 + ResizeObserver）
- ✅ **API 取消逻辑修正**：controller 按身份比对摘除，避免旧请求误删新请求的 controller
- ✅ **工单号格式统一**：新建工单改为 `WO-YYMMDDNNN`，与种子数据一致
- ✅ **菜单高亮修正**：按模块前缀判断，详情页里所属模块保持高亮
- ✅ **移动端适配**：侧栏收窄、网格折叠，390px 下无横向溢出

### 13.5 工程化

- ✅ 详尽 README.md + 本 handoff
- ✅ .env.example 模板
- ✅ .gitignore 完整
- ✅ vue-tsc 类型检查通过
- ✅ vite build 通过
- ✅ 关键路径经真实浏览器实测（功能 + 布局，控制台零错误）

---

## 14. 已知问题

### 14.1 构建警告（不是错误）

```
dist/assets/home-*.js  1,181 kB │ gzip: 395 kB
(!) Some chunks are larger than 500 kB after minification.
```

**原因**：ECharts 全量引入，现在只有首页看板用它（5 张图：4 张分布 + 1 张趋势），所以这一整块都压在首页路由上。

**解决方向**（如果后续要优化）：
- 用 `import * as echarts from 'echarts/core'` 按需引入
- 加 `import { BarChart, LineChart, PieChart } from 'echarts/charts'`
- 加 `import { CanvasRenderer } from 'echarts/renderers'`
- 可减少到 ~300 KB

当前未处理是因为不影响功能，且首页本就是首屏页面。

### 14.2 功能限制

- **无真实后端**：所有数据是 mock + localStorage，刷新数据保留但不能跨设备同步
- **无用户体系**：登录态是 localStorage 假数据，刷新可保留但不能跨设备
- **无权限控制**：登录后所有用户看到一样的数据
- **天气 API 限额**：天行免费版每天有调用次数限制（用完会自动降级到离线演示数据，不报错）
- **备件与工单未打通**：备件出库备注里可以手写工单号，但系统层面还没做关联扣减

### 14.3 浏览器兼容

- 依赖 `AbortController`（Chrome 66+ / Firefox 57+ / Safari 11.1+），不支持 IE
- 依赖 `localStorage`（所有现代浏览器，但隐私模式可能被禁用）
- 图表尺寸联动依赖 `ResizeObserver`（Chrome 64+ / Firefox 69+ / Safari 13.1+）

---

## 15. 扩展建议

按优先级排序，从易到难：

### 15.1 短期（1-2 天）

- **设备详情显示历史工单**：把该设备的所有工单列出来（工单数据已带 `deviceId`，直接筛即可）
- **备件与工单打通**：建单/派工时按设备类型提示所需备件，出库时自动回填工单号并扣减库存
- **维护计划到期提醒**：在首页或顶栏加一个"逾期计划"角标，点进去直达计划页
- **工单处理时长统计**：用 `createTime` / `finishTime` 算平均处理时长，补进首页洞察区

### 15.2 中期（3-7 天）

- **真实后端接入**：用 Express / Fastify / NestJS 起一个简单后端，对接 MySQL / PostgreSQL
- **用户体系**：JWT 登录、注册校验、密码加密（bcrypt）——现在操作日志里的"操作人"就能真正落到实名
- **权限控制**：普通员工只能看/创建；管理员才能删除/修改（备件删除、计划删除这些操作尤其需要）
- **ECharts 按需引入**：解决 chunk size 警告

### 15.3 长期（7+ 天）

- **PWA**：支持离线访问、安装到桌面
- **国际化 i18n**：用 vue-i18n 支持中英切换
- **单元测试**：Vitest + Vue Test Utils（`mock/plans.ts`、`mock/spares.ts` 的纯函数最好测）
- **E2E 测试**：Playwright（本次验收就是这么做的，可以直接固化成用例）
- **CI/CD**：GitHub Actions 自动跑测试 + 自动发布
- **监控**：Sentry 错误上报

---

## 16. 注意事项

### 16.1 接手前必读

1. **Node.js 版本**：项目用 Vite 8 + TypeScript 6，建议 Node.js 20 LTS
2. **天行 key**：自己申请一个；**不申请也能跑**（首页走离线演示数据）
3. **GitHub PAT**：之前在对话里明文贴过，建议立即撤销（https://github.com/settings/tokens）
4. **成员名单**：§1.5 的项目成员名单里有几行是「请填写」占位，**移交前务必补上真实姓名**（宣传组要拿去做 PPT 尾页）
5. **宣传素材**：§4A 是专为 PPT / 视频准备的素材与演示脚本，宣传组只需看那一章

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
| `src/mock/data.ts` | ~245 | 24 设备 + 12 工单 + 操作日志 + 字典 + 存储 |
| `src/views/home/index.vue` | ~1070 | 数据看板（天气 + 3 指标卡 + 5 张图 + 故障排行） |
| `src/views/spare/list.vue` | ~660 | 备件库存（含出入库、流水、新增编辑弹窗） |
| `src/views/plan/list.vue` | ~610 | 维护计划（含完成顺延、筛选、表单弹窗） |
| `src/views/device/detail.vue` | ~590 | 设备详情（基本信息 + 维护时间轴 + 关联备件） |
| `src/views/order/detail.vue` | ~510 | 工单详情（全貌 + 操作日志时间轴 + 流转） |
| `src/views/order/create.vue` | ~480 | 创建工单 |
| `src/views/order/list.vue` | ~465 | 工单列表 |
| `src/views/device/list.vue` | ~390 | 设备台账 |
| `src/layouts/BasicLayout.vue` | ~220 | 主布局（侧栏 + 顶栏 + 菜单高亮） |
| `src/mock/plans.ts` | ~190 | 维护计划数据层 |
| `src/mock/spares.ts` | ~190 | 备件库存数据层 |
| `src/api/index.ts` | ~135 | axios 封装 |
| `src/router/index.ts` | ~91 | 路由 + 守卫 + 兜底 |
| `src/utils/format.ts` | ~60 | 时间/日期 + 当前账号 |
| `src/utils/charts.ts` | ~51 | 图表生命周期 |
| `src/utils/stats.ts` | ~16 | countBy 工具 |
| `vite.config.ts` | ~26 | Vite 配置 |

---

**文档版本**：v1.1  
**最后更新**：2026-10-15  
**对应项目版本**：Day3 + Day4 + 后续迭代（工单详情 / 维护计划 / 备件库存 / 首页洞察 / 离线兜底）  
**注意**：本地仓库当时未安装 Git，本次迭代的提交历史未记录在此，接手后可用 `git log` 自行查看