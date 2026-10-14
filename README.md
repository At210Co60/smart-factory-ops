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

本项目是「智能工厂设备运维管理平台」前端单页应用,核心场景围绕**设备台账维护 + 维护工单流转**两个真实业务展开:

- **设备端**:工厂里有数控机床、注塑机、工业机器人、动力设备、检测设备五大类共 24 台设备,实时掌握每台的运行/故障/停机/维护中状态
- **工单端**:对故障设备生成维护工单(待处理 → 处理中 → 已完成),全过程留痕、可统计、可追溯
- **数据看板**:在首页 Dashboard 用真实天气 API 增强体验,展示关键指标 + 设备类型分布环形图

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
| **ECharts** | latest | 数据可视化(设备类型分布环形图) |
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
| 指标卡片(2 张) | 设备总数(`DEVICES.length`)+ 待处理工单数(`loadOrders().filter(pending)`) |
| 设备类型分布环形图 | ECharts,5 种类型用不同颜色,中间显示 24 总数 |

**数据源**:天行数据 `tianqi` 接口,GET 请求,自动补 key、判 code、相同请求自动取消(用户连续切城市时上一次请求 abort)。

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
| 「为此设备创建工单」 | 主按钮,跳 `/order/create?deviceId=xxx`(设备已预选) |
| 编号无效兜底 | 整页空状态「设备不存在或未选择设备」+ 返回按钮 |

### 4. 工单管理 `/order/list`

**对应文件**:`src/views/order/list.vue`

| 功能点 | 说明 |
|---|---|
| 三个页签 | 待处理 / 处理中 / 已完成,每个右上角带数量角标(5 / 3 / 4) |
| 切页签 | 角标实时更新、表格过滤、页码回 1 |
| 6 列表格 | 工单编号 / 设备名称 / 故障描述 / 优先级(彩色标签)/ 时间 / 操作 |
| 表头文字随页签变 | 已完成页签时间列显示「完成时间」(用 `finishTime`),其他显示「创建时间`(用 `createTime`) |
| 状态流转按钮 | 待处理 →「开始处理」/ 处理中 →「完成」/ 已完成 →「查看设备」 |
| 确认弹框 | 每次流转前半透明遮罩 + 居中弹层(写在文件内,不引外部组件) |
| 时间戳自动写入 | 完成时 `finishTime` 写入 `YYYY-MM-DD HH:mm` |
| 持久化 | 任何改动 `saveOrders()` 写回 localStorage,刷新不丢 |
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
| 工单号自动生成 | `WO-YYYYMMDDNNN` 格式,同一天序号递增,不与已有重复 |
| 提交成功 | 新工单插入列表最前面(状态待处理、创建时间当前时刻、`saveOrders` 持久化),跳回 `/order/list` |
| 带 `?deviceId=xxx` | 从设备详情跳过来时,自动选中对应设备 |
| 取消按钮 | 返回工单列表 |

### 6. 登录/注册 `/login` `/register`

**对应文件**:`src/views/login/index.vue` / `src/views/register/index.vue`(Day2 完成,Day3 未改动)

- 基础账号系统,登录态存 `fop_auth_v1`
- 路由守卫:未登录访问 `/device` `/order` 等被弹回 `/login`

### 7. 布局壳 `BasicLayout`

**对应文件**:`src/layouts/BasicLayout.vue`

- 左侧菜单:数据看板 / 设备台账 / 工单管理 / 创建工单
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
    │   └── data.ts              # 【基石】24 设备 + 12 工单 + loadOrders/saveOrders
    ├── router/
    │   └── index.ts             # 路由表 + 守卫
    └── views/
        ├── home/
        │   └── index.vue        # 数据看板(天气+指标+环形图)
        ├── device/
        │   ├── list.vue         # 设备台账(搜索+筛选+分页)
        │   └── detail.vue       # 设备详情(基本信息+维护时间轴)
        ├── order/
        │   ├── list.vue         # 工单列表(三页签+流转+确认框)
        │   └── create.vue       # 创建工单(选设备+校验+自动编号)
        ├── login/
        │   └── index.vue        # 登录页(Day2 完成)
        └── register/
            └── index.vue        # 注册页(Day2 完成)
```

---

## 六、核心文件说明

| 文件 | 作用 | 行数 | 重要程度 |
|---|---|---|---|
| `src/api/index.ts` | Axios 统一封装,业务代码调 `request` 而非 `axios` | ~120 | ⭐⭐⭐ |
| `src/mock/data.ts` | 24 设备 + 12 种子工单 + localStorage 读写 | ~200 | ⭐⭐⭐ |
| `src/views/home/index.vue` | Dashboard:天气 API + 指标 + ECharts 环形图 | ~430 | ⭐⭐⭐ |
| `src/views/device/list.vue` | 设备台账:三筛选 + 防抖搜索 + 分页 | ~280 | ⭐⭐ |
| `src/views/device/detail.vue` | 设备详情:基本信息 + 确定性维护记录 | ~310 | ⭐⭐ |
| `src/views/order/list.vue` | 工单列表:三页签 + 流转 + 确认弹框 | ~390 | ⭐⭐⭐ |
| `src/views/order/create.vue` | 创建工单:选设备 + 校验 + 自动编号 | ~360 | ⭐⭐ |
| `vite.config.ts` | 端口 8080 + `/tianapi` 代理 → `apis.tianapi.com` | ~30 | ⭐ |
| `.env.development` | 注入 `VITE_TIANAPI_KEY`(本机开发用,**不进版本**) | 2 | ⚠️ |
| `.gitignore` | 排除 `.env*` `node_modules` `dist` 等 | ~25 | ⚠️ |

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
o.status = 'processing'
    ↓
saveOrders(orderList) 写 localStorage[fop_orders_v1]
    ↓
orderList ref 自动触发重新渲染(状态已变)
    ↓
「待处理」页签这条消失,「处理中」页签 + 1
```

**第一次访问**:`loadOrders()` 读 localStorage,读不到就 `saveOrders(SEED_ORDERS)` 把 12 条种子写入,然后返回。

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

- **天行 key 必须自己申请**,本仓库不提供
- **代理只在 dev 生效**,生产部署需要 nginx 反向代理 `/tianapi → apis.tianapi.com`
- **localStorage 容量** ~5-10 MB,工单数据不会爆,但要避免存大文件
- **ECharts 全量引入**导致 home 包约 1.2 MB(gzip 392 KB),需要优化可按需引入:
  ```ts
  import { use } from 'echarts/core')
  import { PieChart, TitleChart } from 'echarts/charts')
  ```
- **手机端** 表格用 `overflow-x: auto` 横向滚动,可考虑后期改成卡片式布局

---

## 十二、贡献 & 许可

- **作者**:MiniMax991646
- **学习文档**:Day3 完整交付(见 [Day3-执行计划.md](./Day3-执行计划.md))
- **License**:MIT(欢迎学习、修改、商用)

---

## 十三、相关链接

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vite 官方文档](https://cn.vite.dev/)
- [Axios 中文文档](http://www.axios-js.com/zh-cn/docs/)
- [ECharts 实例](https://echarts.apache.org/examples/zh/index.html)
- [天行数据 API 市场](https://www.tianapi.com)
- [TypeScript 手册](https://www.typescriptlang.org/zh/docs/)

---

> 最后更新:2026-10-14 · Day3 完整交付 + 4 个延伸任务(API 封装 / 设备筛选 / ECharts / Git 提交)
