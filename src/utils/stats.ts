/**
 * 统计工具：数据分析的公共函数
 *
 * 数据分析一句话套路：按某个字段分组、数出每组有几条，
 * 再把这个「几」交给图表的 data —— countBy 一个函数搞定状态、类型、车间等所有分布。
 */

// 按某个字段分组计数，返回 ECharts 能直接吃的 [{ name, value }] 结构
export function countBy<T>(list: T[], getKey: (item: T) => string) {
  const map = new Map<string, number>()
  for (const item of list) {
    const key = getKey(item)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map].map(([name, value]) => ({ name, value }))
}
