<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import request from '@/api'
import { DEVICES, DEVICE_STATUS, PRIORITY, loadOrders, type WorkOrder } from '@/mock/data'
import { countBy } from '@/utils/stats'
import { mountCharts } from '@/utils/charts'
import { dateOf } from '@/utils/format'

// localStorage 键名：记住用户上次查的城市，刷新/重开浏览器都保留
const CITY_KEY = 'fop_weather_city_v1'

// 默认查福州实时天气，可手动改成其他城市名
function loadStoredCity(): string {
  try {
    return localStorage.getItem(CITY_KEY) || '福州'
  } catch {
    // localStorage 被关闭 / 满了,静默回退到默认值
    return '福州'
  }
}
const city = ref(loadStoredCity())

// 城市变化就写回 localStorage，用户改了立刻持久化(不用等回车/刷新)
watch(city, (val) => {
  try {
    localStorage.setItem(CITY_KEY, val.trim())
  } catch {
    // 静默失败,不影响主流程
  }
})

// 加载中、错误、成功三层状态 —— 文档第 6 节五步思路里的"三种状态都要有"
const loading = ref(false)
const errorMsg = ref('')
const weather = ref<any>(null)
// 当前展示的是不是离线演示数据(没配 key / 请求失败时兜底用)
const isFallback = ref(false)
// 请求序号:用户连续切城市时,只让最后一次请求的结果/状态生效
let loadSeq = 0

/* ============= 离线演示数据 =============
 * 演示场景兜底:没有 VITE_TIANAPI_KEY 或请求失败时,用确定性算法生成一份天气数据,
 * 保证看板在任何环境下都能完整展示,不会出现红色报错。
 * 入参 city 参与 hash,同一城市每次生成的天气一致;日期/星期跟随当天。
 */
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// 各种天气对应的气温区间 / 湿度 / 空气质量,让生成的数据看起来像真的
const WEATHER_POOL = [
  { weather: '晴',       temps: [18, 30], humidity: [35, 60], quality: '优',    aqi: [20, 45] },
  { weather: '多云',     temps: [16, 27], humidity: [45, 70], quality: '良',    aqi: [50, 90] },
  { weather: '阴',       temps: [14, 24], humidity: [55, 80], quality: '良',    aqi: [55, 95] },
  { weather: '小雨',     temps: [12, 21], humidity: [70, 92], quality: '优',    aqi: [25, 50] },
  { weather: '雷阵雨',   temps: [15, 26], humidity: [65, 90], quality: '良',    aqi: [45, 85] },
  { weather: '晴转多云', temps: [17, 28], humidity: [40, 65], quality: '优',    aqi: [30, 55] },
  { weather: '多云转晴', temps: [16, 29], humidity: [40, 68], quality: '良',    aqi: [50, 80] },
]

const WIND_DIRS = ['东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风', '北风']
const WEEK_LABEL = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

// 用「种子 + 序号」再 hash 一次取区间内整数。
// 直接对种子做位运算会有两个坑:短城市名的种子右移后容易变 0(hash 全塌成同一个值),
// 相邻数据之间也容易撞车;先二次 hash 就稳定了。
function pickInRange(seed: number, salt: number, min: number, max: number): number {
  return min + (hashCode(String(seed) + '_' + salt) % (max - min + 1))
}

function buildDemoWeather(city: string) {
  const seed = hashCode(city)
  const w = WEATHER_POOL[seed % WEATHER_POOL.length]
  const real = pickInRange(seed, 1, w.temps[0], w.temps[1])
  const humidity = pickInRange(seed, 2, w.humidity[0], w.humidity[1])
  const windSc = pickInRange(seed, 3, 2, 5)

  // 日期 / 星期跟随当天,用本地时间
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  return {
    area: city,
    date: dateStr,
    week: WEEK_LABEL[today.getDay()],
    weather: w.weather,
    real: String(real),
    highest: String(real + pickInRange(seed, 4, 3, 6)),
    lowest: String(real - pickInRange(seed, 5, 5, 9)),
    humidity: String(humidity),
    wind: WIND_DIRS[seed % WIND_DIRS.length],
    windsc: `${windSc}级`,
    quality: w.quality,
    aqi: String(pickInRange(seed, 6, w.aqi[0], w.aqi[1])),
    tips: `今日${w.weather},气温 ${real}℃ 左右,${w.weather.includes('雨') ? '外出请携带雨具,注意防滑' : '适宜进行户外活动,注意适时补水'}。当前 ${pad(today.getHours())}:${pad(today.getMinutes())}`,
  }
}

/* ============= 指标卡数据 =============
 * 设备总数来自死台账,pending/完成率来自活数据(loadOrders)。
 * 除了"有多少",再给两个比率(设备运行率、工单完成率)——
 * 这是判断"这个厂现在状况如何"最直接的两个数,比单看总数更有信息量。
 */
const deviceTotal = DEVICES.length
const ordersRef = ref<WorkOrder[]>(loadOrders())

const pendingOrderCount = computed(() => ordersRef.value.filter((o) => o.status === 'pending').length)
const doneOrderCount = computed(() => ordersRef.value.filter((o) => o.status === 'done').length)
const runningCount = computed(() => DEVICES.filter((d) => d.status === 'running').length)
const runningRate = computed(() =>
  deviceTotal ? Math.round((runningCount.value / deviceTotal) * 100) : 0,
)
const doneRate = computed(() =>
  ordersRef.value.length ? Math.round((doneOrderCount.value / ordersRef.value.length) * 100) : 0,
)

// 工单页流转/新建后回到看板,重新拉一次让数字跟着更新
function refreshOrderStats() {
  ordersRef.value = loadOrders()
}

// 天行接口：/tianqi/index；type=1 实时天气 / type=7 七天
// 用封装好的 request:自动补 key、自动判 code(非 200 进 catch)、相同请求会自动取消上一次的
async function loadData() {
  // 请求序号:每次调用自增,只有最后一次请求有资格收尾(关 loading / 兜底数据)
  const seq = ++loadSeq
  loading.value = true
  errorMsg.value = ''
  isFallback.value = false
  try {
    // 先看有没有可用的 key:没配(或还是模板占位符)就不发请求,直接走离线演示数据,
    // 避免控制台出现 240 报错、页面出现红色错误块
    const apiKey = import.meta.env.VITE_TIANAPI_KEY
    if (!apiKey || apiKey === 'your_key_here') {
      weather.value = buildDemoWeather(city.value)
      isFallback.value = true
      return
    }
    // 注意:key 不用传,拦截器自动注入
    const res = await request.get('/tianapi/tianqi/index', {
      params: { city: city.value, type: 1 },
    })
    // 拦截器已经把 code !== 200 的情况转成 reject,所以这里直接取数据
    weather.value = res.data.result
  } catch (e: any) {
    // 被静默取消的请求(用户连续切城市时):不报错,交给后一次请求收尾
    if (e?.silent) return
    // 上次请求失败/取消的兜底数据不能盖住新请求的结果
    if (seq !== loadSeq) return
    // 请求失败也兜底成离线演示数据:看板始终有内容可展示/可讲
    weather.value = buildDemoWeather(city.value)
    isFallback.value = true
    // 只在"网络层失败"时把原因透出来。天行的业务错误(如 key 无效/额度用完)走的是
    // 响应拦截器抛的普通 Error,带数字 code 但没有 response——这类不吓唬演示者,
    // 顶部提示条上"未配置或接口不可用"已经说清楚了
    if (!e?.response && typeof e?.code !== 'number') {
      errorMsg.value = (e as Error).message || '请求失败'
    }
  } finally {
    // 只有最后一次请求能关 loading,否则会先闪一下"暂无数据"
    if (seq === loadSeq) loading.value = false
  }
}

/* ============= ECharts 设备类型分布环形图 ============= */
const chartEl = ref<HTMLDivElement | null>(null)

// 颜色:跟状态标签色调统一,视觉不跳脱
const TYPE_COLORS: Record<string, string> = {
  '数控机床':   '#2e7be2',  // 蓝
  '注塑机':     '#f08c2e',  // 橙
  '工业机器人': '#2bbf6a',  // 绿
  '动力设备':   '#9c6ce4',  // 紫
  '检测设备':   '#1f8a8a',  // 青
}

function buildChartOption() {
  // 从 DEVICES 统计各类型数量
  const counts: Record<string, number> = {}
  DEVICES.forEach((d) => {
    counts[d.type] = (counts[d.type] || 0) + 1
  })
  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    itemStyle: { color: TYPE_COLORS[name] || '#8a93ab' },
  }))
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>{c} 台 ({d}%)',
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      textStyle: { color: '#6b7a90', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],   // 环形(不是饼):内径 45%,外径 70%
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{c} 台',
          fontSize: 12,
          color: '#1f2d3d',
        },
        labelLine: { length: 10, length2: 10 },
        // 中间显示总数(标题块)
        title: {
          text: `${DEVICES.length}`,
          subtext: '设备总数',
          left: 'center',
          top: 'center',
          textStyle: {
            fontSize: 24,
            fontWeight: 600,
            color: '#1f2d3d',
          },
          subtextStyle: {
            fontSize: 12,
            color: '#6b7a90',
          },
        },
        data,
      },
    ],
  }
}

/* ============= 数据文件分析：设备状态分布饼图 + 各车间设备数量柱状图 ============= */
// 统计结果用 computed 算出来：DEVICES 是固定数组，countBy 只算一次
const statusData = computed(() => countBy(DEVICES, (d) => DEVICE_STATUS[d.status].label))
const shopData = computed(() => countBy(DEVICES, (d) => d.shop))

const statusChartEl = ref<HTMLDivElement | null>(null)
const shopChartEl = ref<HTMLDivElement | null>(null)

// 状态配色和状态标签保持一致，视觉不跳脱
const STATUS_COLORS: Record<string, string> = {
  '运行': '#2bbf6a',
  '故障': '#d93939',
  '停机': '#8a93ab',
  '维护中': '#f08c2e',
}

/* ============= 近 14 天工单趋势 + 故障工单排行 =============
 * 这两块原来是独立的「数据分析」页,但它和设备类型/状态/车间三张图功能重叠,
 * 而且多一个"看起来也是仪表盘"的页面并不加分。所以去掉那个页面,
 * 只把它独有的"时间维度"和"故障排行"并进看板 —— 页面少一个,洞察一个不少。
 */

// 近 14 天每日创建量:按 createTime 的日期分组
const trendData = computed(() => {
  const days: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const pad = (n: number) => String(n).padStart(2, '0')
    days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }
  const counts = countBy(ordersRef.value, (o) => dateOf(o.createTime))
  return days.map((day) => ({
    day: day.slice(5), // 只留 MM-DD,横轴更清爽
    count: counts.find((c) => c.name === day)?.value ?? 0,
  }))
})

// 故障工单排行:按设备聚合工单数,取前 8
const faultRanking = computed(() => {
  const map = new Map<string, { id: string; name: string; count: number; latest: string }>()
  ordersRef.value.forEach((o) => {
    const cur = map.get(o.deviceId)
    if (cur) {
      cur.count += 1
      if (o.createTime > cur.latest) cur.latest = o.createTime
    } else {
      map.set(o.deviceId, { id: o.deviceId, name: o.deviceName, count: 1, latest: o.createTime })
    }
  })
  return [...map.values()]
    .sort((a, b) => b.count - a.count || (a.latest < b.latest ? 1 : -1))
    .slice(0, 8)
})
const maxFaultCount = computed(() => faultRanking.value[0]?.count || 1)

// 排行里那台设备现在是什么状态(还坏着还是已恢复),给个小色点
function deviceStatusOf(id: string) {
  const d = DEVICES.find((x) => x.id === id)
  return d ? DEVICE_STATUS[d.status] : { label: '—', color: 'gray' }
}

const trendChartEl = ref<HTMLDivElement | null>(null)

function buildTrendOption() {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 28, bottom: 36 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.map((t) => t.day),
    },
    yAxis: { type: 'value', name: '单量', minInterval: 1 },
    series: [
      {
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: trendData.value.map((t) => t.count),
        itemStyle: { color: '#1e6fd9' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 111, 217, 0.28)' },
              { offset: 1, color: 'rgba(30, 111, 217, 0.02)' },
            ],
          },
        },
      },
    ],
  }
}

/* ============= 工单优先级分布柱状图 ============= */
// 工单是活数据(loadOrders()从 localStorage 读)，每次新建/处理/完成都更新一次
// 优先级有固定顺序(高/中/低),即便某一档暂时没有也要补 0,否则柱子会缺一根
const priorityData = computed(() => {
  const orders = loadOrders()
  const counted = countBy(orders, (o) => o.priority)
  return (['high', 'mid', 'low'] as const).map((k) => ({
    name: PRIORITY[k].label,
    value: counted.find((x) => x.name === k)?.value ?? 0,
  }))
})

const priorityChartEl = ref<HTMLDivElement | null>(null)

// 优先级配色：红(高) / 橙(中) / 绿(低)，跟 PRIORITY.color 视觉统一
const PRIORITY_COLORS: Record<string, string> = {
  '高': '#d93939',
  '中': '#f08c2e',
  '低': '#2bbf6a',
}

function buildStatusOption() {
  return {
    // 饼图没有 xAxis / yAxis
    tooltip: { trigger: 'item', formatter: '{b}：{c} 台（{d}%）' },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      textStyle: { color: '#6b7a90', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: '62%',
        center: ['50%', '46%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b} {c} 台', fontSize: 12, color: '#1f2d3d' },
        data: statusData.value.map((it) => ({
          ...it,
          itemStyle: { color: STATUS_COLORS[it.name] || '#8a93ab' },
        })),
      },
    ],
  }
}

function buildShopOption() {
  // 柱状图要多一步拆列：name 列给 X 轴，value 列给 series
  const shopNames = shopData.value.map((it) => it.name)
  const shopCounts = shopData.value.map((it) => it.value)
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: shopNames },
    yAxis: { type: 'value', name: '台数' },
    series: [
      {
        type: 'bar',
        barMaxWidth: 48,
        itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', color: '#1f2d3d' },
        data: shopCounts,
      },
    ],
  }
}

function buildPriorityOption() {
  // 同样是拆列：name 列给 X 轴(三档:高/中/低)，value 列给 series.data
  const names = priorityData.value.map((it) => it.name)
  const values = priorityData.value.map((it) => it.value)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: names },
    yAxis: { type: 'value', name: '单数' },
    series: [
      {
        type: 'bar',
        barMaxWidth: 48,
        // 每根柱子按档位取色,而不是统一一个色
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params: any) => PRIORITY_COLORS[names[params.dataIndex]] || '#8a93ab',
        },
        label: { show: true, position: 'top', color: '#1f2d3d' },
        data: values,
      },
    ],
  }
}

onMounted(() => {
  loadData()
  refreshOrderStats()

  // 五张图的 init / resize / dispose 统一交给 mountCharts(见 utils/charts.ts),
  // 初始化必须在 onMounted 里,DOM 渲染完才能拿到容器
  mountCharts([
    { ref: chartEl, option: buildChartOption() },
    { ref: statusChartEl, option: buildStatusOption() },
    { ref: shopChartEl, option: buildShopOption() },
    { ref: priorityChartEl, option: buildPriorityOption() },
    { ref: trendChartEl, option: buildTrendOption() },
  ])
})
</script>

<template>
  <section class="dashboard">
    <!-- 顶部标题栏：可改城市 + 刷新 -->
    <div class="head-row">
      <h2 class="page-title">数据看板</h2>
      <div class="city-bar">
        <input
          v-model="city"
          type="text"
          class="city-input"
          placeholder="输入城市名（例：福州、北京）"
          @keyup.enter="loadData"
        />
        <button class="reload-btn" @click="loadData">刷新</button>
      </div>
    </div>

    <!-- 状态 1：加载中 -->
    <p v-if="loading" class="status">加载中……</p>

    <!-- 请求彻底失败、且没有任何数据可展示时才占满整块 -->
    <div v-if="errorMsg && !weather" class="status error">
      <p>{{ errorMsg }}</p>
      <button @click="loadData">重新加载</button>
    </div>

    <!-- 离线演示数据提示:内容照常展示,只在顶部加一条说明,避免误会成实时数据 -->
    <div v-if="isFallback && weather" class="fallback-notice">
      <span class="fallback-tag">离线演示</span>
      <span class="fallback-text">
        当前为内置演示数据（未配置天气 API key 或接口不可用），看板其余模块均为真实业务数据
        <template v-if="errorMsg">；接口错误：{{ errorMsg }}</template>
      </span>
    </div>

    <!-- 拿到结果才渲染。v-else 兜底，避免 null 时崩 -->
    <template v-if="weather">
      <!-- 第一行：四张数据卡片 -->
      <div class="cards">
        <div class="card">
          <span class="label">城市</span>
          <span class="value">{{ weather.area || city }}</span>
        </div>
        <div class="card">
          <span class="label">天气</span>
          <span class="value">{{ weather.weather || '—' }}</span>
        </div>
        <div class="card">
          <span class="label">实时气温</span>
          <span class="value">{{ weather.real || '—' }}</span>
        </div>
        <div class="card">
          <span class="label">相对湿度</span>
          <span class="value">{{ weather.humidity ? weather.humidity + '%' : '—' }}</span>
        </div>
      </div>

      <!-- 第二行：信息列表，两列展示 -->
      <div class="info">
        <div class="info-row">
          <span class="label">最高气温</span>
          <span class="value">{{ weather.highest || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="label">最低气温</span>
          <span class="value">{{ weather.lowest || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="label">风向风力</span>
          <span class="value">{{ [weather.wind, weather.windsc].filter(Boolean).join(' · ') || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="label">空气质量</span>
          <span class="value">
            {{ weather.quality || '—' }}
            <em v-if="weather.aqi" class="aqi">（AQI {{ weather.aqi }}）</em>
          </span>
        </div>
        <div class="info-row">
          <span class="label">日期</span>
          <span class="value">{{ weather.date || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="label">星期</span>
          <span class="value">{{ weather.week || '—' }}</span>
        </div>
      </div>

      <!-- 第三块：温馨提示（没有 tips 时整块不渲染） -->
      <div v-if="weather.tips" class="tips">
        <span class="tips-label">温馨提示</span>
        <p class="tips-text">{{ weather.tips }}</p>
      </div>
    </template>

    <!-- 兜底空状态：不在加载中、也没有错误提示时才显示 -->
    <p v-if="!weather && !loading && !errorMsg" class="status">暂无数据</p>

    <!-- 指标卡片:设备运行率 / 待处理工单 / 工单完成率。比率比单看总数更能说明现状 -->
    <div class="stats">
      <div class="stat-card">
        <span class="stat-label">设备运行率</span>
        <span class="stat-value">{{ runningRate }}<em>%</em></span>
        <span class="stat-unit">{{ runningCount }} / {{ deviceTotal }} 台运行中</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">待处理工单</span>
        <span class="stat-value pending">{{ pendingOrderCount }}<em>单</em></span>
        <span class="stat-unit">需尽快派工</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">工单完成率</span>
        <span class="stat-value good">{{ doneRate }}<em>%</em></span>
        <span class="stat-unit">{{ doneOrderCount }} / {{ ordersRef.length }} 单已完成</span>
      </div>
    </div>

    <!-- 第五块：图表与分析区 —— 设备类型 / 状态 / 车间 / 优先级 四张图 2×2 排布 -->
    <div class="analysis-grid">
      <div class="chart-card">
        <h3 class="chart-title">设备类型分布</h3>
        <div ref="chartEl" class="analysis-chart"></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">设备状态分布</h3>
        <div ref="statusChartEl" class="analysis-chart"></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">各车间设备数量</h3>
        <div ref="shopChartEl" class="analysis-chart"></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">工单优先级分布</h3>
        <div ref="priorityChartEl" class="analysis-chart"></div>
      </div>
    </div>

    <!-- 第六块：运维洞察 —— 左边看"工单量怎么走"，右边看"谁最该管" -->
    <h3 class="section-title">运维洞察</h3>
    <div class="insight-grid">
      <div class="chart-card">
        <h3 class="chart-title">
          近 14 天工单创建趋势
          <span class="chart-sub">按工单创建日期统计</span>
        </h3>
        <div ref="trendChartEl" class="analysis-chart"></div>
      </div>

      <div class="rank-card">
        <h3 class="chart-title">
          故障工单排行
          <span class="chart-sub">数量越多越该关注</span>
        </h3>
        <ul v-if="faultRanking.length" class="rank-list">
          <li v-for="(item, i) in faultRanking" :key="item.id" class="rank-item">
            <span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
            <div class="rank-main">
              <div class="rank-line">
                <span class="rank-name">{{ item.name }}</span>
                <span class="rank-count">{{ item.count }} 单</span>
              </div>
              <div class="rank-bar">
                <span
                  class="rank-bar-inner"
                  :style="{ width: (item.count / maxFaultCount) * 100 + '%' }"
                ></span>
              </div>
              <div class="rank-meta">
                <span class="mono">{{ item.id }}</span>
                <span class="tag small" :class="`tag-${deviceStatusOf(item.id).color}`">
                  {{ deviceStatusOf(item.id).label }}
                </span>
                <span class="rank-time">最近 {{ item.latest }}</span>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="rank-empty">暂无工单数据</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部标题栏 */
.head-row {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.city-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.city-input {
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  min-width: 180px;
}

.city-input:focus {
  border-color: var(--primary);
}

.reload-btn {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reload-btn:hover {
  opacity: 0.9;
}

/* 加载中 / 失败 / 空数据 三种状态展示 */
.status {
  background: #fff;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-sub);
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}

.status.error p {
  color: #d93939;
  margin-bottom: 12px;
}

.status.error button {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: #fff;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

/* 离线演示数据提示条：用琥珀色而非红色，表示"降级但仍可用"，不是报错 */
.fallback-notice {
  background: #fff8ec;
  border: 1px solid #f5d9ab;
  border-left: 4px solid #f08c2e;
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.fallback-tag {
  flex-shrink: 0;
  background: #f08c2e;
  color: #fff;
  border-radius: 10px;
  padding: 2px 10px;
  font-size: 12px;
}

.fallback-text {
  color: #8a5b1a;
}

/* 第一行：四张卡片 */
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}

.label {
  color: var(--text-sub);
  font-size: 13px;
}

.value {
  color: var(--text-main);
  font-size: 18px;
  font-weight: 600;
}

/* 第二行：信息列表 */
.info {
  background: #fff;
  border-radius: 12px;
  padding: 4px 20px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px dashed #eef2f8;
  font-size: 14px;
}

.info-row .label {
  font-size: 14px;
}

.info-row .value {
  font-size: 14px;
  font-weight: 500;
}

.aqi {
  font-style: normal;
  font-size: 12px;
  color: var(--text-sub);
  margin-left: 4px;
}

/* 第三块：温馨提示 */
.tips {
  background: #fff;
  border-left: 4px solid var(--primary);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}

.tips-label {
  display: block;
  color: var(--primary);
  font-size: 13px;
  margin-bottom: 6px;
}

.tips-text {
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.6;
}

/* 第四块：指标卡片 */
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
  min-width: 0;
}
.stat-label {
  color: var(--text-sub);
  font-size: 14px;
}
.stat-value {
  color: var(--text-main);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.15;
}
.stat-value em {
  font-style: normal;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-sub);
  margin-left: 2px;
}
.stat-value.pending {
  color: #f08c2e;
}
.stat-value.good {
  color: #2bbf6a;
}
.stat-unit {
  color: var(--text-sub);
  font-size: 12px;
}

/* 图表卡片：白底圆角、轻微阴影 */
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.chart-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-main);
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
/* 图表标题后面的小字说明,避免看板上的数字没有口径 */
.chart-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-sub);
}

/* 第六块：运维洞察(趋势 + 故障排行) */
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 4px 0 0;
  color: var(--text-main);
  padding-left: 10px;
  border-left: 3px solid var(--primary);
  line-height: 1.2;
}
.insight-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
}
.rank-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-width: 0;
}
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rank-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
}
.rank-no {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f0f4fa;
  color: var(--text-sub);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}
.rank-no.top {
  background: var(--primary);
  color: #fff;
}
.rank-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rank-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.rank-name {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  flex-shrink: 0;
}
.rank-bar {
  height: 6px;
  background: #f0f4fa;
  border-radius: 3px;
  overflow: hidden;
}
.rank-bar-inner {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #5b9bee, #1e6fd9);
  border-radius: 3px;
}
.rank-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-sub);
}
.mono { font-family: ui-monospace, monospace; }
.rank-time { margin-left: auto; }
.rank-empty {
  font-size: 13px;
  color: var(--text-sub);
  margin: 0;
}

/* 状态/优先级标签(排行用的小号标签) */
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
}
.tag.small { padding: 0 7px; font-size: 11px; line-height: 16px; }
.tag-green  { background: #2bbf6a; }
.tag-red    { background: #e5454b; }
.tag-gray   { background: #8a93a6; }
.tag-orange { background: #f08c2e; }
.tag-blue   { background: #2e7be2; }

/* 第五块：四张分析图 2×2 排布（宽屏两列，窄屏单列堆叠） */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.analysis-chart {
  width: 100%;
  height: 360px;
}

@media (max-width: 1080px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }
  .insight-grid {
    grid-template-columns: 1fr;
  }
}

/* 手机端：卡片两列、信息列表单列 */
@media (max-width: 720px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .info {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: 1fr;
  }
  .analysis-chart {
    height: 280px;
  }
  .rank-card {
    padding: 14px;
  }
  .rank-meta {
    flex-wrap: wrap;
    gap: 6px;
  }
  .rank-time {
    margin-left: 0;
  }
}
</style>