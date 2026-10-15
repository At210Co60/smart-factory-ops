<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'

// 设备类型占比数据：饼图 data 用 [{ value, name }, ...] 对象数组（写死的练习数据）
const typePieData = [
  { value: 7, name: '数控机床' },
  { value: 5, name: '注塑机' },
  { value: 5, name: '工业机器人' },
  { value: 4, name: '动力设备' },
  { value: 3, name: '检测设备' },
]

const pieEl = ref<HTMLDivElement | null>(null)
let pieChart: echarts.ECharts | null = null

// resize 监听函数必须具名，匿名函数在 onUnmounted 里删不掉
function onResize() {
  pieChart?.resize()
}

onMounted(() => {
  if (pieEl.value) {
    pieChart = echarts.init(pieEl.value)
    pieChart.setOption({
      // 饼图没有坐标轴：不要写 xAxis / yAxis
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
          data: typePieData,
        },
      ],
    })
    window.addEventListener('resize', onResize)
  }
})

onUnmounted(() => {
  // 移除监听 + 销毁实例，避免内存泄漏
  window.removeEventListener('resize', onResize)
  pieChart?.dispose()
  pieChart = null
})
</script>

<template>
  <div class="chart-card">
    <h3 class="chart-title">设备类型占比</h3>
    <div ref="pieEl" class="chart-container"></div>
  </div>
</template>

<style scoped>
/* 卡片样式与主框架保持一致：白底、圆角 12px、轻微阴影、内边距 20px */
.chart-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #1f2d3d;
}

/* 容器必须有明确宽高，否则图表显示不出来 */
.chart-container {
  width: 100%;
  height: 360px;
}
</style>
