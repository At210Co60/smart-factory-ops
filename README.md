# 智能工厂设备运维管理平台 · Smart Factory Ops

> 基于 Vue 3 + TypeScript + Axios + ECharts 的前后端分离实战项目,Day3 完整交付。
> 学习自 [天行数据](https://www.tianapi.com) 公开 API,业务场景以"工厂设备台账 + 工单流转"为核心。

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?logo=vite)](https://vite.dev/)
[![Axios](https://img.shields.io/badge/Axios-1.20-5a29ee?logo=axios)](http://axios-js.com/)
[![ECharts](https://img.shields.io/badge/ECharts-Latest-AA344D?logo=apache-echarts)](https://echarts.apache.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 一、项目简介

本项目是「智能工厂设备运维管理平台」前端单页应用,把工厂设备运维的完整闭环做了一遍:**台账 → 计划 → 执行 → 物料 → 统计**:

- **设备端**:数控机床、注塑机、工业机器人、动力设备、检测设备五大类共 24 台设备,实时掌握每台的运行/故障/停机/维护中状态
- **计划端**:每台设备的保养/巡检/点检/大修计划,到期自动提醒(逾期 / 7 天内到期),完成即按周期顺延
- **工单端**:对故障设备建单(待处理 → 处理中 → 已完成),**每一次操作都有日志留痕**,工单详情页可追溯全过程
- **物料端**:备件库存台账,按设备类型关联备件,低于安全库存自动告警,出入库全程流水
- **看板端**:首页展示实时天气、关键指标(设备运行率 / 待处理工单 / 工单完成率)、5 张分析图 + 故障工单排行

项目从 Day3 课程作业起步,逐步迭代,代码可读性优先,适合作为 Vue3 + TypeScript 入门到中级的实战练手项目。

---

## 二、技术栈

### 🛠️ 核心框架

| 技术 | 版本 | 用途 |
|---|---|---|
| **Vue** | ^3.5.42 | 渐进式前端框架,使用 `<script setup>` 组合式 API |
| **TypeScript** | ~6.0.2 | 类型系统,所有 .vue 文件使用 `lang="ts"` |
| **Vite** | ^8.3.0 | 构建工具,dev server 启动 < 1s,支持 HMR |
| **vue-router** | ^4.6.4 | 单页路由,包含路由守卫(未登录拦截) |
| **vue-tsc** | ^3.3.11 | .vue 文件的 TypeScript 类型检查 |

### 🌐 数据层

| 技术 | 版本 | 用途 |
|---|---|---|
| **Axios** | ^1.20.0 | HTTP 客户端,封装在 `src/api/index.ts` |
| **ECharts** | latest | 数据可视化(首页 5 张图:类型/状态/车间/优先级 + 14 天工单趋势) |
| **localStorage** | 浏览器原生 | 持久化工单(会流转的活数据)+ 城市记忆 |

### 🎨 样式

- **CSS 变量主题**(`src/style.css` 定义 `--primary` / `--text-main` / `--text-sub` / `--bg-page`)
- **原生 CSS + scoped**,不引入 UI 组件库(降低学习门槛)
- 响应式:`@media (max-width: 720px / 900px)` 适配手机端

### 🔧 工具

- **Node.js + npm** — 包管理
- **PowerShell / Git Bash** — 命令行(Windows)
- **Git** — 版本控制(已在仓库初始化并提交)

---

## 三、功能模块

### 1. 数据看板 `/home` (Dashboard)

**对应文件**:`src/views/home/index.vue`

| 区块 | 功能 |
|---|---|
| 顶部工具栏 | 城市输入框 + 刷新按钮,**localStorage 记忆上次选择的城市** |
| 天气卡片(4 张) | 城市 / 天气 / 实时气温 / 相对湿度 |
| 信息列表(6 行) | 最高 / 最低气温 / 风向风力 / 空气质量(含 AQI)/ 日期 / 星期 |
| 温馨提示 | 整段展示 `tips` 字段,左侧蓝色装饰条 |
| 指标卡片(3 张) | **设备运行率**(16/24 台)+ **待处理工单数** + **工单完成率**,后两个是活数据 |
| 图表区(2×2) | 设备类型分布环形图 / 设备状态分布饼图 / 各车间设备数量柱状图 / 工单优先级分布柱状图 |
| 运维洞察 | **近 14 天工单创建趋势**面积折线图 + **故障工单排行**(按设备聚合工单数,带进度条与设备状态) |

**数据源**:天行数据 `tianqi` 接口,GET 请求,自动补 key、判 code、相同请求自动取消(用户连续切城市时上一次请求 abort)。

**离线演示兜底**:没配 key(key 为空或还是模板占位符)时**不发网络请求**,直接用内置的确定性算法生成一份像样的天气数据,并在页面顶部显示一条琥珀色「离线演示」提示;key 失效或接口不可用时也会自动降级到同一套数据。这样断网、没申请 key 的情况下也能完整演示,不会出现红色报错。

### 2. 设备台账 `/device/list`

**对应文件**:`src/views/device/list.vue`

| 功能点 | 说明 |
|---|---|
| 关键字搜索 | 匹配设备名称 / 编号 / 型号 / 车间 4 个字段,350ms 防抖,回车立即查询 |
| 类型筛选 | 下拉:全部 / 数控机床 / 注塑机 / 工业机器人 / 动力设备 / 检测设备 |
| 状态筛选 | 下拉:全部 / 运行 / 故障 / 停机 / 维护中 |
| 7 列表格 | 编号 / 名称 / 类型 / 车间 / 负责人 / 状态(彩色标签)/ 操作(详情) |
| 状态标签颜色 | 运行绿 / 故障红 / 停机灰 / 维护中橙 |
| 详情跳转 | 点「详情」跳 `/device/detail/:id` |
| 分页 | 每页 5 / 10 / 20 可选,上一页 / 下一页,显示「共 X 条」 |
| 筛选/分页/搜索/重置 | 切换任意一个自动回到第 1 页;重置一键清空所有条件 |
| 空状态 | 「未找到匹配的设备」居中提示 |

### 3. 设备详情 `/device/detail/:id`

**对应文件**:`src/views/device/detail.vue`

| 功能点 | 说明 |
|---|---|
| 路由参数取编号 | `useRoute().params.id` |
| 顶部返回栏 | 「← 返回台账」按钮 + 设备名 + 状态标签 |
| 基本信息卡(左) | 8 项两列:编号 / 类型 / 型号 / 车间 / 负责人 / 状态 / 投产日期 / 最近保养 |
| 维护记录卡(右) | 3 条竖向时间轴,每条含:日期 / 类型标签 / 维护内容 / 处理人 |
| 时间轴类型颜色 | 例行保养蓝 / 故障维修红 / 巡检绿 |
| 确定性生成 | 维护记录按设备 id 哈希生成(同设备每次进来内容一致) |
| 故障设备首条 | 状态为故障(fault)的设备,维护记录第一条**强制**「故障维修」 |
| **关联备件卡** | 按设备类型反查备件库,显示该机型常用备件的库存与缺货情况,可一键去备件库存页 |
| **最近保养联动** | 优先读维护计划里"实际哪天做完的",在计划页点过「完成本次」后这里会跟着更新 |
| 「为此设备创建工单」 | 主按钮,跳 `/order/create?deviceId=xxx`(设备已预选) |
| 编号无效兜底 | 整页空状态「设备不存在或未选择设备」+ 返回按钮 |

### 4. 工单管理 `/order/list`

**对应文件**:`src/views/order/list.vue`

| 功能点 | 说明 |
|---|---|
| 三个页签 | 待处理 / 处理中 / 已完成,每个右上角带数量角标(5 / 3 / 4) |
| 切页签 | 角标实时更新、表格过滤、页码回 1 |
| 6 列表格 | 工单编号 / 设备名称 / 故障描述 / 优先级(彩色标签)/ 时间 / 操作 |
| **编号可点击** | 点工单编号或操作列「详情」进 `/order/detail/:no` |
| 表头文字随页签变 | 已完成页签时间列显示「完成时间」(用 `finishTime`),其他显示「创建时间`(用 `createTime`) |
| 状态流转按钮 | 待处理 →「开始处理」/ 处理中 →「完成」/ 已完成 →「查看设备」 |
| 确认弹框 | 每次流转前半透明遮罩 + 居中弹层(写在文件内,不引外部组件) |
| 时间戳自动写入 | 完成时 `finishTime` 写入 `YYYY-MM-DD HH:mm` |
| 持久化 | 流转统一走 `transitionOrder()`,改状态 + 写操作日志 + 存 localStorage 一步到位 |
| 查看设备跳转 | 已完成行的「查看设备」文字按钮跳 `/device/detail/:id` |
| 空状态 | 「暂无待处理 / 处理中 / 已完成工单」分别提示 |
| 优先级颜色 | 高红 / 中橙 / 低绿 |
| 创建工单按钮 | 工具栏右侧主按钮,跳 `/order/create` |

### 5. 创建工单 `/order/create`

**对应文件**:`src/views/order/create.vue`

| 功能点 | 说明 |
|---|---|
| 顶部返回栏 | 「← 返回工单列表」 |
| 选设备(必填) | 输入框检索(按名称/编号)→ 下拉最多 8 条 → 选中后变成「编号 · 名称 · 车间」+ 清除按钮 |
| 故障描述(必填) | 多行文本,5-500 字,右下字数计数 `XX/500` |
| 优先级(必填) | 高 / 中 / 低三张单选卡片,默认选中「中」 |
| 校验 | 未选设备 →「请选择设备」;描述 < 5 字 →「描述至少 5 个字」(红色小字) |
| 输入自动清错 | 监听 desc,字数达到 5 自动清除错误 |
| 工单号自动生成 | `WO-YYMMDDNNN` 格式(年份两位,与种子数据一致),同一天取最大序号 +1 |
| 提交成功 | 新工单插入列表最前面(状态待处理、创建时间当前时刻、写入首条操作日志),跳回 `/order/list` |
| 带 `?deviceId=xxx` | 从设备详情跳过来时,自动选中对应设备 |
| 取消按钮 | 返回工单列表 |

### 6. 工单详情 `/order/detail/:no`

**对应文件**:`src/views/order/detail.vue`

| 功能点 | 说明 |
|---|---|
| 入口 | 工单列表点编号或「详情」按钮进入 |
| 顶部栏 | 返回按钮 + 工单号(等宽字体)+ 状态标签 + 优先级标签 |
| 工单信息卡(左) | 故障描述**整段展示**(不再被表格省略号截断)、关联设备(可点击跳设备详情)、设备编号、优先级、状态、创建/完成时间 |
| 操作日志卡(右) | 时间轴:创建工单(灰点)→ 开始处理(蓝点)→ 完成工单(绿点),每条含时间 / 操作人 / 说明 |
| 本页流转 | 按状态给出「开始处理」/「标记完成」,确认后**停在本页**、时间轴立刻新增一条 |
| 日志来源 | 数据层 `opLog` 字段,由 `transitionOrder()` 统一写入;老数据读取时自动迁移补出 |
| 编号无效兜底 | 整页空状态「工单不存在或未选择工单」+ 返回按钮 |

### 7. 维护计划 `/plan/list`

**对应文件**:`src/views/plan/list.vue`

| 功能点 | 说明 |
|---|---|
| 顶部汇总卡 | 计划总数 / 已逾期 / 7 天内到期 / 已停用 |
| 列表排序 | 按紧迫度自动排序:逾期 → 即将到期 → 正常 → 已停用 |
| 状态与倒计时 | 状态标签(红/橙/绿/灰)+ 倒计时文案(「已逾期 3 天」/「还有 2 天」/「今天到期」) |
| 筛选 | 关键字(设备名/编号/内容/负责人)+ 状态筛选 + 维护类型筛选(例行保养/巡检/点检/大修) |
| 完成本次 | 记录本次日期,并按周期顺延下次日期;**逾期的从今天起算**,不会一完成又立刻逾期 |
| 停用 / 启用 | 停用的计划不参与到期判断,行置灰 |
| 新增 / 编辑 | 弹窗表单:选设备自动带出名称与负责人、周期预设 chip(7/15/30/60/90/180/365 天)、日期选择器 |
| 删除 | 带确认弹框 |
| 状态不落库 | 逾期/即将到期全部按下次维护日期**现算**,不需要有人每天改数据 |

### 8. 备件库存 `/spare/list`

**对应文件**:`src/views/spare/list.vue`

| 功能点 | 说明 |
|---|---|
| 顶部汇总卡 | 备件种类 / 缺货 / 低于安全库存 / 库存正常 |
| 补货提醒条 | 有缺货或低库存时自动出现(琥珀色,是提醒不是报错) |
| 列表排序 | 缺货排最前,其次低库存;库存数字在异常时标红 |
| 库存状态 | 按数量与安全库存现算:0 = 缺货 / 低于安全库存 = 低库存 / 其余正常 |
| 入库 / 出库 | 弹窗填数量与备注;**出库超过现有库存会被拦截**并提示「库存不足:现有 N」,不会写出负库存 |
| 出入库流水 | 点备件名称查看完整流水:入/出、数量、时间、经办人、用途备注 |
| 新增 / 编辑备件 | 备件编号自动生成(SP-00X);**库存数量只能走出入库**,编辑时锁定,避免绕过流水 |
| 适配设备类型 | 每个备件挂在设备类型下,设备详情页可反查"这台设备要用的件够不够" |

### 9. 登录/注册 `/login` `/register`

**对应文件**:`src/views/login/index.vue` / `src/views/register/index.vue`(Day2 完成)

- 基础账号系统,登录态存 `fop_auth_v1`
- 路由守卫:未登录访问 `/device` `/order` 等被弹回 `/login`
- 操作日志的"操作人"取自登录账号(读不到时用「系统管理员」)

### 10. 布局壳 `BasicLayout`

**对应文件**:`src/layouts/BasicLayout.vue`

- 左侧菜单 6 项:数据看板 / 设备台账 / 维护计划 / 备件库存 / 创建工单 / 工单管理
- 菜单高亮按**模块前缀**判断,使详情页也保持所属模块高亮(如工单详情页仍亮「工单管理」)
- 顶部栏:当前页标题 + 当前用户 + 退出按钮
- 中间区域:`<RouterView />` 路由出口

---

## 四、API 封装(亮点)

**文件**:`src/api/index.ts`

所有 HTTP 请求统一通过封装的 `request` 实例,不再在业务页面里写 `import axios from 'axios'`。封装要点:

### 1. 自动补天行 key

```ts
request.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_TIANAPI_KEY
  if (apiKey && !config.params?.key) {
    config.params.key = apiKey
  }
  return config
})
```

业务代码只关心业务参数,key 由拦截器注入,避免每个调用方重复。

### 2. 业务状态码自动判

```ts
request.interceptors.response.use((response) => {
  const data = response.data
  if (data?.code !== undefined && data.code !== 200) {
    return Promise.reject(new Error(data.msg || `接口错误: ${data.code}`))
  }
  return response
})
```

天行接口的 HTTP 永远 200,业务码在 `data.code`,拦截器提前把非 200 转成 reject,业务代码 catch 即可。

### 3. 相同请求自动取消(AbortController)

```ts
const pendingControllers = new Map<string, AbortController>()

request.interceptors.request.use((config) => {
  const key = `${config.method}_${config.url}`
  // 取消上一次的相同请求
  if (pendingControllers.has(key)) {
    pendingControllers.get(key)!.abort()
  }
  const controller = new AbortController()
  config.signal = controller.signal
  pendingControllers.set(key, controller)
  return config
})
```

**实战场景**:用户在城市输入框快速连改 `北京` → `上海` → `广州`,中间两次请求会被自动 abort,只有最后一次成功,避免数据错乱。`axios.isCancel(error)` 区分主动取消,业务侧不报错。

### 4. 统一超时(15s)

```ts
const request = axios.create({ timeout: 15000 })
```

---

## 五、文件树

```
smart-factory-ops/
├── .env.development             # 本地环境变量(已 .gitignore,不进版本)
├── .env.example                 # 环境变量模板(示例文件,进版本)
├── .gitignore                   # Git 排除规则
├── Day3-执行计划.md              # Day3 学习文档的执行计划表
├── index.html                   # Vite 入口 HTML
├── package.json                 # 依赖清单 + npm scripts
├── package-lock.json            # 锁版本
├── tsconfig.json                # TS 总配置
├── tsconfig.app.json            # TS 应用配置
├── tsconfig.node.json           # TS Node 配置
├── vite.config.ts               # Vite 配置(端口 8080 + /tianapi 代理)
├── public/
│   └── favicon.svg              # 网站图标
└── src/
    ├── App.vue                  # 根组件(只有 <RouterView/>)
    ├── main.ts                  # 入口(创建 Vue 实例 + 注册路由)
    ├── style.css                # 全局 CSS 重置 + 主题变量
    ├── api/
    │   └── index.ts             # 【亮点】Axios 封装(拦截器+取消+超时)
    ├── layouts/
    │   └── BasicLayout.vue      # 主布局(侧栏 + 顶栏 + 出口)
    ├── mock/
    │   ├── data.ts              # 【基石】24 设备 + 12 工单 + 操作日志 + loadOrders/saveOrders
    │   ├── plans.ts             # 维护计划:种子 + 日期状态推导 + 完成/启停
    │   └── spares.ts            # 备件库存:种子 + 出入库 + 库存状态推导
    ├── router/
    │   └── index.ts             # 路由表 + 守卫 + 兜底路由
    ├── utils/
    │   ├── stats.ts             # countBy 分组统计
    │   ├── format.ts            # 时间/日期格式化 + 当前登录账号
    │   └── charts.ts            # ECharts 初始化/尺寸联动/销毁
    └── views/
        ├── home/
        │   └── index.vue        # 数据看板(天气 + 指标 + 5 张图 + 故障排行)
        ├── device/
        │   ├── list.vue         # 设备台账(搜索+筛选+分页)
        │   └── detail.vue       # 设备详情(基本信息+维护时间轴+关联备件)
        ├── plan/
        │   └── list.vue         # 维护计划(状态推导+完成顺延+新增编辑)
        ├── spare/
        │   └── list.vue         # 备件库存(低库存告警+出入库+流水)
        ├── order/
        │   ├── list.vue         # 工单列表(三页签+流转+确认框)
        │   ├── detail.vue       # 工单详情(全貌 + 操作日志时间轴)
        │   └── create.vue       # 创建工单(选设备+校验+自动编号)
        ├── login/
        │   └── index.vue        # 登录页(Day2 完成)
        └── register/
            └── index.vue        # 注册页(Day2 完成)
```

---

## 六、核心文件说明

| 文件 | 作用 | 重要程度 |
|---|---|---|
| `src/api/index.ts` | Axios 统一封装,业务代码调 `request` 而非 `axios` | ⭐⭐⭐ |
| `src/mock/data.ts` | 24 设备 + 12 种子工单 + 操作日志 + localStorage 读写 | ⭐⭐⭐ |
| `src/views/home/index.vue` | Dashboard:天气(含离线兜底)+ 3 指标卡 + 5 张图 + 故障排行 | ⭐⭐⭐ |
| `src/mock/plans.ts` | 维护计划:种子 + 日期状态推导 + 完成顺延 + 停用删除 | ⭐⭐⭐ |
| `src/mock/spares.ts` | 备件库存:种子 + 出入库(含超量拦截)+ 状态推导 | ⭐⭐⭐ |
| `src/views/order/detail.vue` | 工单详情:全貌 + 操作日志时间轴 + 本页流转 | ⭐⭐ |
| `src/views/plan/list.vue` | 维护计划页:紧迫度排序 + 筛选 + 完成/停用 + 新增编辑弹窗 | ⭐⭐ |
| `src/views/spare/list.vue` | 备件库存页:告警条 + 出入库 + 流水弹窗 | ⭐⭐ |
| `src/views/device/list.vue` | 设备台账:双筛选 + 防抖搜索 + 分页 | ⭐⭐ |
| `src/views/device/detail.vue` | 设备详情:基本信息 + 确定性维护记录 + 关联备件 | ⭐⭐ |
| `src/views/order/list.vue` | 工单列表:三页签 + 流转 + 确认弹框 | ⭐⭐⭐ |
| `src/views/order/create.vue` | 创建工单:选设备 + 校验 + 自动编号 | ⭐⭐ |
| `src/utils/charts.ts` | 图表 init / 尺寸联动(ResizeObserver)/ 销毁统一收口 | ⭐⭐ |
| `vite.config.ts` | 端口 8080 + `/tianapi` 代理 → `apis.tianapi.com` | ⭐ |
| `.env.development` | 注入 `VITE_TIANAPI_KEY`(本机开发用,**不进版本**) | ⚠️ |
| `.gitignore` | 排除 `.env*` `node_modules` `dist` 等 | ⚠️ |

---

## 七、数据流

### 1. 设备数据(死数据,固定数组)

```
src/mock/data.ts 的 DEVICES
    ↓ import
list.vue / detail.vue 直接读
    ↓ 筛选用 computed(不改原数组)
渲染到表格
```

### 2. 工单数据(活数据,localStorage 持久化)

```
用户点「开始处理」
    ↓
list.vue 的 startProcess(o) 弹确认框
    ↓ 确认
transitionOrder(orders, no, 'processing')
  ├─ 改 status
  ├─ 追加一条操作日志(opLog)
  └─ saveOrders() 写 localStorage[fop_orders_v1]
    ↓
orderList ref 拿到新数组,自动触发重新渲染
    ↓
「待处理」页签这条消失,「处理中」页签 + 1
```

**第一次访问**:`loadOrders()` 读 localStorage,读不到就写入 12 条种子再返回。
**老数据兼容**:加 `opLog` 字段之前存下的工单,读取时会自动补出操作日志并写回,不用手动清缓存。

### 3. 维护计划 / 备件库存(各自独立的活数据)

```
维护计划:loadPlans() → fop_plans_v1
  状态(逾期/即将到期)不落库,由 planStatus(p) 按 nextDate 与今天现算
  点「完成本次」→ 记录 lastDate,按 cycleDays 顺延 nextDate → savePlans()
      ↓
  设备详情页的「最近保养」优先读这里的 lastDate(跨模块联动)

备件库存:loadSpares() → fop_spares_v1
  入库/出库 → moveSpare() 校验(出库超量直接拒绝)→ 改 qty + 追加流水 → saveSpares()
      ↓
  设备详情页按设备类型反查备件库,缺货/低库存直接标出
```

两个模块都是**懒加载**:只有真正打开过对应页面才会写入种子数据。

### 3. 天气数据(实时 API)

```
用户输入「北京」按回车
    ↓
city.value = '北京'(watch 同步写 localStorage 记忆)
    ↓
loadData()
    ↓
request.get('/tianapi/tianqi/index', { params: { city: '北京' } })
    ↓
src/api/index.ts 的请求拦截器:
  - 自动注入 key
  - 取消上一次的请求(如果还没返回)
  - 创建新 AbortController 挂到 config.signal
    ↓
Vite 代理把 /tianapi/tianqi/index 转发到 https://apis.tianapi.com/tianqi/index
    ↓
天行返回 { code: 200, msg: 'success', result: { area: '北京市', ... } }
    ↓
响应拦截器:code === 200 通过,否则 reject
    ↓
weather.value = res.data.result
    ↓
Vue 响应式触发,模板重新渲染,显示北京天气
```

---

## 八、快速开始

### 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9
- 浏览器(推荐 Chrome / Edge 最新版)

### 安装

```bash
# 克隆仓库
git clone https://github.com/At210Co60/smart-factory-ops.git
cd smart-factory-ops

# 安装依赖
npm install
```

### 配置环境变量(必做)

```bash
# 复制模板
cp .env.example .env.development
```

编辑 `.env.development`:

```env
VITE_APP_NAME=智能工厂设备运维管理平台
VITE_TIANAPI_KEY=你的天行数据 key
```

> ⚠️ **如何获取天行 key**:去 [tianapi.com](https://www.tianapi.com) 注册账号 → 控制台 → 我的接口 → 申请「天气预报」(免费) → 我的密钥 复制粘贴过来。
>
> ⚠️ **不要把真 key commit 到仓库**,`.gitignore` 已排除 `.env*`,但仍需注意截图分享时打码。

### 启动开发服务器

```bash
npm run dev
```

浏览器打开 [http://localhost:8080](http://localhost:8080)

### 打包构建

```bash
npm run build
```

产物在 `dist/` 目录,部署到任何静态服务器即可(线上部署需要在 nginx 层做同样的 `/tianapi` 代理转发)。

### 类型检查

```bash
npx vue-tsc --noEmit
```

---

## 九、运行截图位置

请参考代码中的注释和样式,本项目以**代码即文档**为原则,所有页面都通过 `<style scoped>` 自解释。

---

## 十、学习路线(本项目对应)

1. **认识接口**:Day1-2 完成基础 Vue 项目搭建
2. **配置环境**:Day3 装 axios + 配代理 + 写 `.env`
3. **发请求**:用 `request.get` 调天行
4. **拿数据**:判 `code === 200` → 取 `result`
5. **上屏**:Vue 响应式 + 模板渲染 + 三态(加载/失败/空)
6. **业务数据**:本地 `mock/data.ts` 模拟,工单走 localStorage
7. **进阶**:ECharts 图表、API 拦截器、请求取消

---

## 十一、注意事项 & 已知问题

- **天行 key 必须自己申请**,本仓库不提供。**没配 key 也能跑**:首页会自动用离线演示数据兜底并标注,不会报错
- **代理只在 dev 生效**,生产部署需要 nginx 反向代理 `/tianapi → apis.tianapi.com`
- **localStorage 容量** ~5-10 MB,工单/计划/备件数据不会爆,但要避免存大文件
- **ECharts 全量引入**导致含图表的页面 chunk 约 1.18 MB(gzip ~395 KB),需要优化可按需引入:
  ```ts
  import { use } from 'echarts/core'
  import { BarChart, LineChart, PieChart } from 'echarts/charts'
  import { CanvasRenderer } from 'echarts/renderers'
  ```
- **手机端** 表格用 `overflow-x: auto` 横向滚动,侧栏会收窄成 84px 窄条;可考虑后期改成卡片式布局
- **删除模块后**遗留的地址会被兜底路由送回首页,不会再出现空白页

---

## 十二、项目成员

| 角色 | 成员 | 负责内容 |
|---|---|---|
| 开发 | At210Co60 | 项目框架搭建、Axios 封装、设备台账/详情、工单列表/创建、ECharts 集成 |
| 开发 | 请填写 | 工单详情与操作日志、维护计划模块、备件库存模块、首页洞察区、离线演示兜底 |
| 宣传制作 | 请填写 | PPT 制作、功能演示视频、项目宣传文案 |
| 指导/评审 | 请填写 | 需求评审、演示验收 |

> 带「请填写」的行需替换为真实姓名；详细分工与宣传素材见 [handoff.md](./handoff.md) 的 §1.5 与 §4A。

---

## 十三、贡献 & 许可

- **作者**:MiniMax991646
- **学习文档**:Day3 完整交付(见 [Day3-执行计划.md](./Day3-执行计划.md))
- **License**:MIT(欢迎学习、修改、商用)

---

## 十四、相关链接

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vite 官方文档](https://cn.vite.dev/)
- [Axios 中文文档](http://www.axios-js.com/zh-cn/docs/)
- [ECharts 实例](https://echarts.apache.org/examples/zh/index.html)
- [天行数据 API 市场](https://www.tianapi.com)
- [TypeScript 手册](https://www.typescriptlang.org/zh/docs/)

---

> 最后更新:2026-10-15
