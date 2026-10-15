/**
 * ECharts 图表管理工具
 *
 * 一个页面挂多张图时,重复写 init / setOption / resize / dispose 很啰嗦,
 * 这里统一收口:
 *   const charts = mountCharts([{ ref: elA, option: buildOptionA() }, ...])
 * 自动完成初始化、尺寸变化联动,组件卸载时在 onUnmounted 里 dispose 释放。
 *
 * 尺寸变化为什么用 ResizeObserver 而不是 window.resize:
 * 窗口尺寸没变、但布局变了(比如响应式断点把两列折成一列、侧边栏收起),
 * window.resize 不触发,图表会保持旧宽度把页面撑出横向滚动条。
 * 直接盯容器更准,两种场景都能覆盖。
 */

import * as echarts from 'echarts'
import type { Ref } from 'vue'
import { onUnmounted } from 'vue'

export interface ChartSpec {
  ref: Ref<HTMLDivElement | null>
  option: Record<string, any>
}

export function mountCharts(specs: ChartSpec[]) {
  const instances: echarts.ECharts[] = []
  const observers: ResizeObserver[] = []

  specs.forEach((s) => {
    if (!s.ref.value) return
    const el = s.ref.value
    const inst = echarts.init(el)
    inst.setOption(s.option)
    instances.push(inst)

    // 容器尺寸一变就重算,回调里 ECharts 自己量宽高,不用传参
    const ob = new ResizeObserver(() => inst.resize())
    ob.observe(el)
    observers.push(ob)
  })

  function disposeAll() {
    observers.forEach((ob) => ob.disconnect())
    observers.length = 0
    instances.forEach((c) => c.dispose())
    instances.length = 0
  }

  onUnmounted(disposeAll)

  return { instances, disposeAll }
}
