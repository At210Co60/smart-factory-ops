# Day3 执行计划（逐条对照 Day3.pdf）

> 依据：Day3.pdf 全 13 页。本文按 PDF 页码标注出处，保证不遗漏任何一条内容。
> 项目路径：`C:\Users\15271\Desktop\web-project`

---

## 总览：PDF 的完整结构

| 区块 | PDF 页 | 节次 | 是否要动手 |
|---|---|---|---|
| 一、Axios | P1–P8 | 1–8 节 | 是 |
| 二、传统项目完善 | P8–P13 | 1–9 节 | 是 |
| 收尾任务 | P13 | — | 是 |

**一句话目标一（P1）**：用 Axios 向天行数据接口发查询与提交请求，把拿到的数据渲染到「数据看板」页，跑通「发请求 → 拿数据 → 上屏」。

**一句话目标二（P8）**：原型 index.html 里跑通的四个页面——设备台账、设备详情、工单列表、创建工单——在 web-project 里用 Vue3 补完，数据规模与交互跟原型对齐（24 台设备、12 条种子工单）。

**PDF 强调的生成顺序（P8，别跳步）**：先跑第 3 节生成 `src/mock/data.ts` 并通过自查 → 再按第 4 → 5 → 6 → 7 节逐页生成。后面的页面全从这个文件取数据，数据文件没生成好，页面生成了也是白屏。

---

## 阶段 0：项目对齐（PDF 没写，但你项目必须先做）

PDF 假定了一套文件名，你项目里是另一套。不先对齐，后面所有提示词里的【当前文件】都会写错。

| PDF 中的路径（P8–P9 盘点表） | 你项目实际路径 | 现状 |
|---|---|---|
| `src/views/user/Login.vue`（392 行，已完成） | `src/views/login/index.vue`（330 行） | 已有 |
| `src/layouts/AdminLayout.vue`（393 行，已完成） | `src/layouts/BasicLayout.vue`（146 行） | 已有，但行数差很多 |
| `src/router/index.ts`（已完成） | `src/router/index.ts`（64 行） | 已有 |
| `src/views/dashboard/Dashboard.vue` | `src/views/home/index.vue`（24 行） | 空壳 |
| `src/views/device/DeviceList.vue` | `src/views/device/list.vue`（24 行） | 空壳 |
| `src/views/device/DeviceDetail.vue` | `src/views/device/detail.vue`（30 行） | 空壳 |
| `src/views/work-order/WorkOrderList.vue` | `src/views/order/list.vue`（24 行） | 空壳 |
| `src/views/work-order/WorkOrderCreate.vue` | `src/views/order/create.vue`（24 行） | 空壳 |
| `src/mock/data.ts` | 不存在 | 待新建 |

**要做的三件事**：

1. 确定按谁走。推荐：**保持你项目现有路径**，把 PDF 提示词里的【当前文件】逐个改成真实路径。
2. 核对 `src/router/index.ts`：PDF 说四条路由已建好——`/device`、`/device/:id`、`/work-order`、`/work-order/create`，要跟你实际的 `list.vue / detail.vue / order` 目录对上。
3. 确认 `vite.config.ts` 已有 `@` 别名（你有）、有没有 `server.proxy`（你没有，阶段 1 补）。

**完成标准**：浏览器敲 `/device` 能命中 `src/views/device/list.vue`。

---

## 阶段 1：Axios 环境准备（P2–P3 第 4 节「准备：安装、密钥、代理」）

**前置动作（PDF 未写但必需）**：去 tianapi.com 注册账号 → 控制台申请接口 → 拿到自己的 key。没 key 这块跑不通，只能先做第二块。

### 第 1 步：安装 axios（P2）

```bash
npm install axios
```

### 第 2 步：密钥写进环境变量（P2）

在已有的 `.env.development` 追加一行：

```
VITE_TIANAPI_KEY=你的密钥
```

**PDF 的两条硬性提醒**：
- 变量名必须 `VITE_` 开头（否则 Vite 不注入）
- 改完 `.env` **必须重启开发服务器**才生效

### 第 3 步：配置 Vite 代理（P3）

你 `vite.config.ts` 里 `@` 别名已配好，只需在 `defineConfig` 里追加 `server.proxy`：

```ts
server: {
  port: 8080,           // 你项目固定了 8080，保留
  proxy: {
    '/tianapi': {
      target: 'https://apis.tianapi.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/tianapi/, ''),
    },
  },
},
```

**效果**：代码里写 `/tianapi/tianqi/index` == 请求 `https://apis.tianapi.com/tianqi/index`，跨域交给 Vite 开发服务器解决。

**PDF 特别说明（P3）**：代理只在 `npm run dev` 时生效。以后打包上线，需要在服务器（nginx）上做同样的转发。

**完成标准**：重启 dev，Network 面板能看到 `/tianapi/xxx` 请求且无跨域报错。

---

## 阶段 2：接口认知（P1–P4 第 1–3 节）——理论，必须看懂，不用写代码

### 2.1 Axios 是什么 / 为什么学（P1 第 1、2 节）

- 基于 Promise 的 HTTP 请求库，提供：请求拦截器、响应拦截器、请求取消、并发请求、请求重试。
- 为什么学：前后端分离项目都用统一请求方式，避免每个页面重复写原生请求、重复处理错误码；请求取消用于用户快速切换页面时取消上一次请求，防止数据错乱。
- **原生 vs Axios 对比表（P1，5 个维度）**：

| 能力 | 原生请求 | Axios |
|---|---|---|
| 返回格式解析 | 需手动 `res.json()` | 自动解析，直接拿 `res.data` |
| 错误处理 404/500 | 不报错，要手动判断 `res.ok` | 非 2xx 自动抛错，直接进失败分支 |
| 拦截器 | 无，要自己封装 | 内置请求 / 响应拦截器 |
| 超时控制 | 要配合 AbortController 手写 | 配置 `timeout` 即可 |
| TypeScript | 需手动定义类型 | 内置泛型支持 `axios.get<User>()` |

### 2.2 天行数据接口（P1–P2 第 3 节）

- 统一格式：`https://apis.tianapi.com/接口名/index?key=你的密钥&其他业务参数`
- 本项目用到的接口（P2 表格）：

| 接口 | 地址里的接口名 | 业务参数 |
|---|---|---|
| 天气预报 | `tianqi` | `city`（城市名或城市 ID）、`type`（1 实时 / 7 七天） |
| 英语一句话 | `ensentence` | 无 |

- 请求方式：查询（GET）与提交（POST）都支持，同一个接口两种方式都能调。
- 返回格式：utf-8 的 JSON，**固定三层结构**：

```json
{ "code": 200, "msg": "success", "result": {} }
```

`code` 是业务状态码，必须等于 200 才算调用成功；`msg` 成功是 success，失败是中文错误原因；`result` 是真正的业务数据（每个接口都不一样）。

### 2.3 常见业务状态码（P2 表格，7 个，必须全记住）

| code | 含义 | 怎么处理 |
|---|---|---|
| 200 | 成功 | 取 `result` 用 |
| 130 | 调用频率超限 | 放慢请求节奏 |
| 150 | 可用次数不足 | 换账号或购买次数 |
| 160 | 当前未申请该 API | 去控制台申请对应接口 |
| 230 | API 密钥无效 | 检查 key 是否填错 |
| 240 | 缺少 API 密钥参数 | 检查 key 有没有传进去 |
| 250 | 数据返回为空 | 检查参数值（如城市名写错） |

### 2.4 两个坑（P2）

1. **传输状态永远是 200**。就算密钥错了、次数用完了，传输状态也是 200，错误信息藏在外层 `code` 里。所以 `try/catch` 抓错误分支抓不到它，**必须自己判断状态码 `code`**。
2. **浏览器直接请求会被跨域拦截**。天行接口没开放跨域允许，开发阶段用 Vite 代理转发（阶段 1）。

---

## 阶段 3：GET 与 POST 请求练习（P3–P4 第 5 节）

### 3.1 最简单的 GET 查询（P3 第 1 步）——拿福州实时天气

```ts
import axios from 'axios'
const key = import.meta.env.VITE_TIANAPI_KEY
// GET：参数放 params，会被拼成 URL 上的查询字符串
const res = await axios.get('/tianapi/tianqi/index', {
  params: { key, city: '福州', type: 1 },   // 1 = 实时天气
})
console.log(res.data)          // 完整返回体 { code, msg, result }
console.log(res.data.code)     // 200 才是成功
console.log(res.data.result)   // 真正的天气数据
```

返回示例的 `result` 部分（P3 节选）：`area`、`weather`、`real`、`highest`、`lowest`、`humidity`、`wind`、`windsc`、`quality`、`date`、`week`、`tips`。

**关键字段对照（P4）**：`result.area` 城市、`result.real` 实时气温、`result.weather` 天气状况、`result.humidity` 湿度、`result.wind` + `result.windsc` 风向风力、`result.quality` 空气质量。

### 3.2 POST 提交（P4 第 2 步）——同一个接口换 POST

天行接口的提交请求用**表单格式**（`application/x-www-form-urlencoded`），不是 JSON。所以参数不能直接丢个对象进去，要先转成表单。

```ts
// 用 URLSearchParams（浏览器原生支持）
const form = new URLSearchParams()
form.append('key', key)
form.append('city', '福州')
form.append('type', '1')
await axios.post('/tianapi/tianqi/index', form)

// 也可以简写
await axios.post('/tianapi/tianqi/index', new URLSearchParams({ city: '福州', type: '1' }))
```

### 3.3 params 与 data 的区别（P4，本节最容易搞混）

| | 用法 | 实际请求 |
|---|---|---|
| `params` | 查询参数，拼在 URL 后面，适合 GET | `GET /tianapi/tianqi/index?city=福州&type=1` |
| `data` | 放在请求体里，适合 POST / PUT | `POST /tianapi/tianqi/index`，请求体是 `city=福州&type=1` |

**记忆一句话**：查询把参数贴在网址上，提交把数据塞进肚子里。

---

## 阶段 4：把天气渲染到数据看板页（P5–P6 第 6 节）

PDF 指定拿空壳的 Dashboard 页练手（你项目对应 `src/views/home/index.vue`）。**思路五步**：

1. 页面上先摆好「坑位」——几张数据卡片
2. 页面加载时发请求
3. 发请求时把密钥 key 和业务参数一起传进去
4. 拿到返回体后，先判断状态码是不是 200，是就把业务数据赋给响应式变量，模板里用 `{{ }}` 显示
5. 三种状态都要有：加载中、请求失败（带重新加载按钮）、数据为空

### PDF 给的核心代码（P5，script 部分）

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
const key = import.meta.env.VITE_TIANAPI_KEY   // 密钥从环境变量读
const loading = ref(false)
const errorMsg = ref('')
const weather = ref<any>(null)

async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    // ① 发请求：GET，参数放 params
    const res = await axios.get('/tianapi/tianqi/index', {
      params: { key, city: '福州', type: 1 },
    })
    // ② 判断业务状态码：传输状态都是 200，成败要看 code
    if (res.data.code !== 200) {
      throw new Error(res.data.msg || `接口错误：${res.data.code}`)
    }
    // ③ 取业务数据：数据在 res.data.result 里
    weather.value = res.data.result
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
onMounted(loadData)
</script>
```

### 模板部分（P5–P6）

```vue
<template>
  <div class="dashboard">
    <p v-if="loading">加载中 ……</p>
    <p v-else-if="errorMsg">
      {{ errorMsg }}
      <button @click="loadData">重新加载</button>
    </p>
    <div v-else-if="weather" class="cards">
      <div class="card">
        <span class="label">城市</span>
        <span class="value">{{ weather.area }}</span>
      </div>
      <!-- 再加几张卡片：天气、实时气温、湿度 …… -->
    </div>
  </div>
</template>
```

### 换成 POST 只需改请求那一句（P6）

```ts
// POST：天行接口要求表单格式，参数用 URLSearchParams 传
const form = new URLSearchParams({ key, city: '福州', type: '1' })
const res = await axios.post('/tianapi/tianqi/index', form)
```

其余代码不动。

**PDF 的设计取舍说明（P6）**：不封装的好处是每一步都看得见，调通链路最快。等页面多了可以再考虑把「补 key、判 code」这两件事抽出去——本节保持最直白的写法，先把数据调到页面上再说。

**完成标准**：Dashboard 页显示福州实时天气；把 key 改错能看到中文错误提示和「重新加载」按钮。

---

## 阶段 5：★ 数据渲染提示词模板（P6–P8 第 7 节）

这是文档给 Trae 的通用模板。**用法**：整段复制给 Trae，**只改标了「★替换」的地方**，其他不用动。换接口、换返回结构，也只改这三处。

### 模板固定部分（不用改）

- 【当前文件】`src/views/news/ToutiaoHot.vue`（Vite + Vue3 + TypeScript，组件用 `<script setup lang="ts">` 写）→ **你要改成自己的真实文件路径**
- 【背景】这是「智能工厂设备运维管理平台」的数据看板页，需要把接口返回的数据渲染成卡片和列表。
- 【请求方式】在页面里直接用 axios 发请求（项目没做请求封装）：

```ts
import axios from 'axios'
const key = import.meta.env.VITE_TIANAPI_KEY
const res = await axios.get('/toutiaohot/index', { params: { key } })
```

说明：拿到的 res 是完整返回体，业务数据在 `res.data.result` 里，用之前必须先判断 `res.data.code` 是否等于 200。

### ★替换一：返回数据结构（两个例子）

例子 A——头条热榜（P6）：

```json
{
  "msg": "success",
  "code": 200,
  "result": {
    "list": [
      { "word": "北方小年吃什么", "hotindex": 5036779 },
      { "word": "韩国：欢迎中国游客早日到访济州", "hotindex": 4027665 },
      { "word": "希望推动中美经贸关系早日重回正轨", "hotindex": 4451258 }
    ]
  }
}
```

例子 B——天气接口（PDF 已填好的示例，P7，照着感受一下）：

```json
{
  "code": 200,
  "msg": "success",
  "result": {
    "area": "福州市", "weather": "多云", "real": "26 ℃",
    "highest": "31 ℃", "lowest": "23 ℃", "humidity": "78",
    "wind": "东南风", "windsc": "1-2 级", "quality": "优", "aqi": "34",
    "date": "2026-10-13", "week": "星期二", "tips": "天气较热，建议着短袖……"
  }
}
```

### ★替换二：要渲染的字段

例子 B（P7 字段清单，8 项）：

- 城市：`result.area`
- 天气：`result.weather`
- 实时气温：`result.real`
- 最高气温：`result.highest`
- 最低气温：`result.lowest`
- 相对湿度：`result.humidity`
- 风向风力：`result.wind` 加 `result.windsc`
- 空气质量：`result.quality`（空气指数 `result.aqi`）

### ★替换三：页面区块（P7 末尾，3 块）

1. 顶部一行数据卡片：城市、天气、实时气温、湿度，四张卡片横排，手机端两列
2. 第二行信息列表：最高气温、最低气温、风向风力、空气质量、日期、星期，按「名称：数值」两列展示
3. 第三块提示区：把 `result.tips` 整段显示在卡片里，作为温馨提示

### 【硬性约束】（P7，8 条，全文适用）

1. 请求在页面加载时触发，用 `async` / `await`，必须带 `try` / `catch`
2. 取数据前先判断 `res.data.code` 是否等于 200，不等于就把 `res.data.msg` 当错误提示抛出来
3. 加载中、请求失败、数据为空三种状态都要处理：失败时显示中文错误提示和一个「重新加载」按钮
4. 模板里取值前要判空，不能因为某个字段没返回就整页白屏
5. 界面上所有可见文字一律用中文，不要出现英文单词
6. 样式写在 `<style scoped>` 里，卡片白底圆角、主色 `#1e6fd9`、页面背景 `#f3f5f9`，与主框架一致
7. 不要引入组件库或其他新依赖，不要修改 `vite.config.ts` 等其他文件
8. 只输出【当前文件】指定的这一个文件的完整代码，不要解释，不要省略

---

## 阶段 6：常见报错对照表（P8 第 8 节，8 行）

出问题时直接查这张表：

| 现象 | 原因 | 解决 |
|---|---|---|
| 控制台报跨域错误 | 浏览器直接请求了天行接口 | 用 `/tianapi` 代理，检查 `vite.config.ts` 并重启开发服务器 |
| 返回 `code` 230 | 密钥无效 | 检查 `.env` 里的 key，注意有没有多余空格 |
| 返回 `code` 240 | 缺少密钥参数 | 检查请求参数里有没有带上 key |
| 返回 `code` 160 | 没申请这个接口 | 去天行控制台申请对应接口 |
| 返回 `code` 150 | 次数用完了 | 换账号或购买次数 |
| 拿到 `res.data` 不知道取哪个字段 | 没区分外层和业务数据 | 业务数据在 `res.data.result`，取之前先判 `res.data.code === 200` |
| 查询能通、提交报缺参数 | 提交时用了 JSON 格式 | 天行要求表单格式，用 `new URLSearchParams({...})` 传 |
| 页面白屏 | 接口失败没做兜底 | 补上 `try` / `catch` 和失败提示 |

---

## 阶段 7：先生成模拟数据文件 `src/mock/data.ts`（P8–P10 第 3 节）★最关键★

**为什么先做这个**：四个页面全都从这个文件取数据。PDF 强调——数据文件没生成好，页面生成了也是白屏。

**为什么工单要存本地存储**（P10）：设备是只读的台账，写死数组就行；工单会被「创建、流转」，改完要存下来，刷新页面才不丢。

**关键点**：提示词里把「必须导出什么、数量是多少、格式长什么样」写死——**导出名一个都不能改**，改了后面的页面就取不到数据。

### 7.1 统一提示词模板（P9 第 2 节）——五段提示词的公共部分，先整段粘这个

- 【技术背景】Vite + Vue3 + TypeScript 项目，组件一律用 `<script setup lang="ts">` 写法。
- 【硬性约束】5 条：
  1. 界面上所有可见文字一律用中文（数据文件里的文字也会显示到页面上，同样全中文），不要出现英文单词
  2. 变量名、函数名用简短英文，注释用中文
  3. 只用 Vue3 组合式 API（ref、computed、watch、onMounted）和原生标签（表格、输入框、按钮），不要引入组件库或其他新依赖
  4. 样式写在 `<style scoped>` 里：卡片白底圆角、主色 `#1e6fd9`、页面背景 `#f3f5f9`，与主框架保持一致
  5. 只输出【当前文件】指定的这一个文件的完整代码，不要解释，不要省略

### 7.2 数据文件专属内容（接在模板后面）

**【当前文件】** `src/mock/data.ts`（新建文件）

**【任务】** 为「智能工厂设备运维管理平台」生成模拟数据文件。设备是只读台账，直接写成固定数组；工单会被创建和流转，改完要能存下来，所以工单存在浏览器本地存储里。文件是纯数据文件，不写页面代码。

**【必须导出的内容】（P9–P10，8 项，名称一个都不能改，后面的页面要 import）**

1. `DEVICE_STATUS`：设备状态映射，running 运行 / fault 故障 / stopped 停机 / maintain 维护中，每项含中文文字和颜色类名（green / red / gray / orange）
2. `Device` 接口：字段 `id`、`name`、`type`、`shop`、`model`、`owner`、`startDate`、`lastMaint`、`status`
3. `DEVICES`：24 条设备数组，类型是 `Device[]`
4. `ORDER_STATUS`：工单状态映射，pending 待处理 / processing 处理中 / done 已完成（颜色类名 orange / blue / green）
5. `PRIORITY`：优先级映射，high 高 / mid 中 / low 低（颜色类名 red / orange / green）
6. `WorkOrder` 接口：字段 `no`、`deviceId`、`deviceName`、`desc`、`priority`、`status`、`createTime`、`finishTime`
7. `loadOrders()`：从本地存储读工单数组（键名 `fop_orders_v1`），读不到就把 12 条种子工单写进去再返回
8. `saveOrders(list: WorkOrder[])`：把工单数组写回本地存储（同一个键名）

**【设备数据要求】（24 条，6 条）**

1. 编号从 `EQ-1001` 到 `EQ-1024` 连续递增
2. 类型五种：数控机床 7 台、注塑机 5 台、工业机器人 5 台、动力设备 4 台、检测设备 3 台
3. 车间在「一号车间 / 二号车间 / 三号车间」里分配
4. 状态分布：运行 16 台、故障 3 台、停机 3 台、维护中 2 台
5. 设备名称、型号、负责人（中文姓名）、投产日期、最近保养日期都写合理内容，日期在 2022 到 2026 年之间
6. 注塑机的名称里要含「注塑」两个字（如「注塑机 IM-320」），其他类型设备的名称和型号里不要出现「注塑」

**【工单种子数据要求】（12 条，7 条）**

1. 状态数量必须是：待处理 5 条、处理中 3 条、已完成 4 条
2. 编号格式：`WO` + 年月日 + 3 位序号，如 `WO-261011001`、`WO-261011002`，依次递增不重复
3. `deviceId` 从 `DEVICES` 里真实存在的编号中选，`deviceName` 必须与该编号设备的 `name` 完全一致（**一票否决项**）
4. 故障描述写真实场景的中文（如「主轴异响，加工精度超差」「液压油温过高报警」），5 到 30 字
5. 优先级高 / 中 / 低都要有
6. 已完成的工单 `finishTime` 填「年-月-日 时:分」，其他状态留空字符串
7. 创建时间在最近一个月内

### 7.3 生成后自查（P10，4 条全过再继续）

1. 文件里能搜到 `EQ-1024`，设备数组 `DEVICES` 一共 24 条
2. 数一遍种子工单：待处理 5、处理中 3、已完成 4（后面工单列表页的角标就是 5 / 3 / 4）
3. 随便挑一条工单的 `deviceId`，在 `DEVICES` 里能找到同编号设备且名称一致
4. 浏览器控制台执行 `localStorage.clear()` 后刷新，工单回到 12 条种子数据

**阶段 7 完成标准**：4 条自查全过。否则后面全是白屏。

---

## 阶段 8：设备台账列表页（P10–P11 第 4 节）

**【当前文件】** 你项目对应 `src/views/device/list.vue`（现在是只有标题的空壳页）

**【任务】** 补全「设备台账」列表页：关键字搜索 + 分页 + 状态标签。

**【数据来源】**

```ts
import { DEVICES, DEVICE_STATUS } from '@/mock/data'
```

`DEVICES` 是 24 条设备数组；`DEVICE_STATUS` 是状态文字映射（运行 / 故障 / 停机 / 维护中）。

**【页面结构】（3 条）**

1. 顶部工具栏：搜索框（占位文字「搜索设备名称 / 编号 / 型号」）+「查询」按钮 +「重置」按钮
2. 数据表格：设备编号、设备名称、类型、所在车间、负责人、状态、操作（「详情」文字按钮）七列
3. 底部分页：上一页、页码、下一页，右侧显示「共 x 条」，每页条数可选（5 / 10 / 20）

**【交互要求】（7 条，P11）**

1. 搜索匹配名称、编号、型号、车间四个字段，不分大小写；输入停顿 350 毫秒自动查询（防抖），回车立即查询，点「重置」清空关键字并回到第 1 页
2. 搜索或切换每页条数后，页码自动回到第 1 页
3. 状态列显示彩色标签：运行绿色、故障红色、停机灰色、维护中橙色
4. 点「详情」跳转到 `/device/设备编号`
5. 没有匹配数据时，表格区域显示居中空状态「未找到匹配的设备」
6. 筛选和分页都用计算属性算出来，不要改动原始设备数组

**生成后自查（P11，4 条）**

1. 搜「注塑」只剩注塑机
2. 搜「EQ-10」能按编号命中
3. 第 2 页点「详情」能进对应设备
4. 切每页条数后回到第 1 页

---

## 阶段 9：设备详情页（P11 第 5 节）

**【当前文件】** 你项目对应 `src/views/device/detail.vue`（空壳页）

**【任务】** 补全「设备详情」页：基本信息 + 维护记录时间轴。

**【数据来源】**

```ts
import { DEVICES, DEVICE_STATUS } from '@/mock/data'
```

路由是 `/device/:id`，从路由参数取设备编号（`useRoute().params.id`），再从 `DEVICES` 里找到对应设备。

**【页面结构】（4 条）**

1. 顶部返回栏：「返回台账」按钮（点击回 `/device`）+ 设备名称 + 状态标签
2. 左卡「基本信息」：设备编号、设备类型、设备型号、所在车间、负责人员、运行状态、投产日期、最近保养，信息项两列排布
3. 右卡「维护记录」：3 条记录的竖向时间轴，每条含日期、类型标签（例行保养蓝色 / 故障维修红色 / 巡检绿色）、维护内容、处理人；卡片底部一个「为此设备创建工单」主按钮
4. 设备编号无效时：整页空状态「设备不存在或未选择设备」+「返回设备台账」按钮

**【交互要求】（2 条）**

1. 维护记录按设备编号**稳定**生成 3 条（同一个设备每次进来内容一样），日期从近到远排序；**故障状态的设备第一条必须是故障维修**
2. 点「为此设备创建工单」跳到 `/work-order/create`，并把设备编号带在地址上（地址参数 `deviceId`）

**生成后自查（P11，3 条）**

1. 地址栏把编号改成 `EQ-1008`，页面跟着换设备
2. 「返回台账」回列表
3. 「为此设备创建工单」跳创建页且设备已选中

---

## 阶段 10：工单列表页（P11–P12 第 6 节）

**【当前文件】** 你项目对应 `src/views/order/list.vue`（空壳页）

**【任务】** 补全「工单管理」列表页：三个状态页签 + 状态流转。

**【数据来源】**

```ts
import { loadOrders, saveOrders, ORDER_STATUS, PRIORITY } from '@/mock/data'
```

`loadOrders()` 从本地存储读工单数组（第一次自动落 12 条种子数据），`saveOrders(list)` 写回；工单字段以数据文件里的 `WorkOrder` 接口为准（编号、关联设备、故障描述、优先级、状态、创建时间、完成时间）。

**【页面结构】（4 条）**

1. 工具栏右侧「创建工单」主按钮，点击跳 `/work-order/create`
2. 三个页签：待处理、处理中、已完成，每个页签右上角带数量角标
3. 表格列：工单编号、设备名称、故障描述、优先级、时间、操作
4. 底部分页（同设备台账列表）

**【交互要求】（7 条）**

1. 点页签只显示对应状态的工单，页码回到第 1 页，角标数量实时更新
2. 「已完成」页签的时间列显示完成时间，其他页签显示创建时间（**表头文字跟着变**）
3. 状态流转：待处理行显示「开始处理」按钮 → 点击确认后变处理中；处理中行显示「完成」按钮 → 点击确认后变已完成并写入完成时间；已完成行显示「查看设备」文字按钮 → 跳对应设备详情页
4. 每次流转前弹确认框（标题 + 说明 + 取消 / 确定按钮，**确认框直接写在本文件里**：半透明遮罩加居中弹层）
5. 任何改动都要 `saveOrders` 保存，刷新页面不丢失
6. 空状态：页签没数据时表格区域显示对应提示（如「暂无待处理工单」）
7. 标签颜色：优先级——高红色、中橙色、低绿色；状态——待处理橙色、处理中蓝色、已完成绿色

**生成后自查（P12，4 条）**

1. 三个页签角标是 5 / 3 / 4
2. 把一条待处理工单走完「开始处理 → 完成」全链路
3. 刷新页面状态不回退
4. 「查看设备」能跳到对应设备详情

---

## 阶段 11：创建工单页（P12–P13 第 7 节）

**【当前文件】** 你项目对应 `src/views/order/create.vue`（空壳页）

**【任务】** 补全「创建工单」页：选设备 + 故障描述 + 优先级 + 提交。

**【数据来源】**

```ts
import { DEVICES, loadOrders, saveOrders } from '@/mock/data'
```

路由 `/work-order/create`，可能带地址参数 `deviceId`（从设备详情页跳过来时预设设备）。

**【页面结构】（2 条）**

1. 顶部返回栏：「返回工单列表」按钮（点击回 `/work-order`）
2. 表单卡片「创建工单」：
   - **选择设备（必填）**：输入框检索（按名称 / 编号），下方下拉列出最多 8 条匹配设备，点一条选中；选中后输入框变成一个选择框，显示「编号 · 名称 · 车间」，右侧带清除按钮
   - **故障描述（必填）**：多行文本框，5 到 500 字，右下角显示当前字数 / 500
   - **优先级（必填）**：高 / 中 / 低三张单选卡片，默认选中「中」
   - 底部「取消」（返回列表）和「提交工单」按钮

**【交互要求】（4 条）**

1. 校验：没选设备提示「请选择设备」；描述不足 5 字提示「描述至少 5 个字」；提示为红色小字显示在对应项下方，输入变化时自动清除
2. 工单编号自动生成：`WO` + 年月日 + 3 位序号（如 `WO-261013001`），同一天序号递增，不与已有工单重复
3. 提交成功：新工单插入列表最前面（状态待处理、创建时间为当前的年月日时分、完成时间为空），`saveOrders` 保存，跳回 `/work-order`
4. 带 `deviceId` 进入页面时，自动选中对应设备

**生成后自查（P13，4 条）**

1. 不选设备直接提交会被拦
2. 从设备详情跳过来时设备已选中且可清除
3. 提交后列表第一条就是新工单、编号格式正确
4. 刷新页面新工单还在

---

## 阶段 12：Dashboard 补两块指标卡片（P13 任务 ②）

在数据看板页**天气卡片下方**，用数据文件里的 `DEVICES` 和 `loadOrders()` 补两块指标卡片：

- 设备总数 ← `DEVICES.length`
- 待处理工单数 ← `loadOrders()` 里筛 `status === 'pending'` 的条数

**设备类型分布环形图（ECharts）下节课接**，本节不做。

---

## 阶段 13：验收清单 + 录屏（P13 第 8 节 + 任务）

### 13.1 逐条过一遍

| 页面 | 验收点 |
|---|---|
| 台账 | 搜「注塑」只剩注塑机；分页、每页条数切换正常；点详情进 `/device/EQ-xxxx` |
| 详情 | 改地址栏编号能切换设备；返回台账正常；「为此设备创建工单」带着 deviceId 跳创建页 |
| 工单列表 | 页签角标 5 / 3 / 4；「开始处理 → 完成」全链路带确认框；刷新不丢；「查看设备」能跳详情 |
| 创建工单 | 三条校验都生效；提交后跳列表且新工单在第一条；编号格式 `WO-年月日-序号` |
| 全局 | 界面文字全中文；不登录直接访问 `/device` 会被弹回登录页；手机宽度不横向溢出 |

### 13.2 收尾任务（P13）

1. 四个页面全部补完并**推送到代码仓库**
2. 数据看板页在天气卡片下方补两块指标卡片（设备总数、待处理工单数）
3. 设备类型分布环形图（ECharts）下节课接

### 13.3 提交物

**任务：完成系统 + 网络请求模块 1 个 ⇒ 完成录屏。**

---

## 附录：执行顺序与依赖

```
阶段 0 项目对齐
   ↓
阶段 1 axios + key + 代理  ──┬─→ 阶段 2 认知（随时看）
   ↓                         │
阶段 3 GET/POST 练习 ────────┤
   ↓                         │
阶段 4 Dashboard 天气卡片 ←───┘
   ↓
阶段 5 掌握★提示词模板（★替换一/二/三 + 8 条硬性约束）
   ↓
阶段 6 报错对照表（出问题时查）
   ↓
★★ 阶段 7 mock/data.ts（必须先做完并通过 4 条自查）★★
   ↓
   ├─→ 阶段 8 设备台账 list.vue
   ├─→ 阶段 9 设备详情 detail.vue
   ├─→ 阶段 10 工单列表 order/list.vue
   └─→ 阶段 11 创建工单 order/create.vue
   ↓
阶段 12 Dashboard 指标卡片
   ↓
阶段 13 验收清单 → 推送仓库 → 录屏
```

## 附录：PDF 小结（P13 第 9 节）

- **Axios 三件事**：带上密钥、判断状态码、取业务数据；提交（POST）记得用 `URLSearchParams` 转表单格式。
- **完善页面的套路**：先让 Trae 生成数据文件（导出名写死）→ 再按页生成 → 按验收清单自查。提示词 = 统一模板 + 专属五块（当前文件、任务、数据来源、页面结构、交互要求），约束只在模板里写一遍。
- **工单是「活」数据**（会创建、会流转），所以用 `loadOrders` / `saveOrders` 走本地存储存取；**设备是「死」台账**，固定数组就够。

## 附录：学习路线（P1）

认识接口 → 配好环境 → 发查询与提交请求 → 在页面上渲染 → 换数据结构上线

> 每一步都是上一步「不够用」逼出来的。