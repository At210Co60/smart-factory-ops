<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import request from '@/api'
import { DEVICES, DEVICE_STATUS, PRIORITY, loadOrders } from '@/mock/data'
import { countBy } from '@/utils/stats'

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

// 指标卡片数据(文档第 9 节任务 ②)：设备总数(死台账)+ 待处理工单数(活数据,从 localStorage 取)
const deviceTotal = DEVICES.length
const pendingOrderCount = ref(0)
function refreshPendingCount() {
  const orders = loadOrders()
  pendingOrderCount.value = orders.filter((o) => o.status === 'pending').length
}

// 天行接口：/tianqi/index；type=1 实时天气 / type=7 七天
// 用封装好的 request:自动补 key、自动判 code(非 200 进 catch)、相同请求会自动取消上一次的
async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    // 注意:key 不用传,拦截器自动注入
    const res = await request.get('/tianapi/tianqi/index', {
      params: { city: city.value, type: 1 },
    })
    // 拦截器已经把 code !== 200 的情况转成 reject,所以这里直接取数据
    weather.value = res.data.result
  } catch (e: any) {
    // 被静默取消的请求(用户连续切城市时)不报错
    if (e?.silent) return
    errorMsg.value = (e as Error).message || '请求失败'
  } finally {
    loading.value = false
  }
}

/* ============= ECharts 设备类型分布环形图 ============= */
const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

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
let statusChart: echarts.ECharts | null = null
let shopChart: echarts.ECharts | null = null

// 状态配色和状态标签保持一致，视觉不跳脱
const STATUS_COLORS: Record<string, string> = {
  '运行': '#2bbf6a',
  '故障': '#d93939',
  '停机': '#8a93ab',
  '维护中': '#f08c2e',
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
let priorityChart: echarts.ECharts | null = null

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

// 窗口变化时四个图表都重绘（具名函数，才能被 removeEventListener 删掉）
function onResize() {
  chart?.resize()
  statusChart?.resize()
  shopChart?.resize()
  priorityChart?.resize()
}

onMounted(() => {
  loadData()
  refreshPendingCount()

  // 初始化图表：init 必须在 onMounted 里，DOM 渲染完才能拿到容器
  if (chartEl.value) {
    chart = echarts.init(chartEl.value)
    chart.setOption(buildChartOption())
  }
  if (statusChartEl.value) {
    statusChart = echarts.init(statusChartEl.value)
    statusChart.setOption(buildStatusOption())
  }
  if (shopChartEl.value) {
    shopChart = echarts.init(shopChartEl.value)
    shopChart.setOption(buildShopOption())
  }
  if (priorityChartEl.value) {
    priorityChart = echarts.init(priorityChartEl.value)
    priorityChart.setOption(buildPriorityOption())
  }
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  // 移除监听 + 销毁全部实例，避免内存泄漏
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  statusChart?.dispose()
  shopChart?.dispose()
  priorityChart?.dispose()
  chart = null
  statusChart = null
  shopChart = null
  priorityChart = null
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

    <!-- 状态 2：请求失败（中文错误 + 重新加载按钮） -->
    <div v-else-if="errorMsg" class="status error">
      <p>{{ errorMsg }}</p>
      <button @click="loadData">重新加载</button>
    </div>

    <!-- 状态 3：拿到结果才渲染。v-else-if 用 weather 兜底，避免 null 时崩 -->
    <template v-else-if="weather">
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

    <!-- 兜底空状态 -->
    <p v-else class="status">暂无数据</p>

    <!-- 第四块：指标卡片(设备总数 / 待处理工单数)。独立显示,不受天气状态影响 -->
    <div class="stats">
      <div class="stat-card">
        <span class="stat-label">设备总数</span>
        <span class="stat-value">{{ deviceTotal }}</span>
        <span class="stat-unit">台</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">待处理工单</span>
        <span class="stat-value pending">{{ pendingOrderCount }}</span>
        <span class="stat-unit">单</span>
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
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}
.stat-label {
  color: var(--text-sub);
  font-size: 14px;
  margin-right: auto;
}
.stat-value {
  color: var(--text-main);
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
}
.stat-value.pending {
  color: #f08c2e;
}
.stat-unit {
  color: var(--text-sub);
  font-size: 13px;
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
}

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
}
</style>