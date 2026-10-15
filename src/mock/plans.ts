/**
 * 维护计划本地存储
 *
 * 和工单的关系:工单是"坏了才修"(事后),这里是"到点就保养"(事前),
 * 两者共用同一批设备台账,维护计划完成后会把结果同步到设备的最近保养日期。
 *
 * 存储方式与 order 一致:整数组存 localStorage,首次访问写入种子数据。
 * 状态(即将到期/已逾期)不落库,由日期现算 —— 这样不用每天去改数据。
 */

import { dateAfterDays, formatDate, nowStr } from '@/utils/format'

const PLANS_KEY = 'fop_plans_v1'

/** 维护类型(与设备详情的维护记录类型保持同一套叫法) */
export const PLAN_TYPES = ['例行保养', '巡检', '点检', '大修'] as const
export type PlanType = (typeof PLAN_TYPES)[number]

/** 维护周期(天)预设 */
export const CYCLE_PRESETS = [7, 15, 30, 60, 90, 180, 365] as const

export interface MaintenancePlan {
  id: string          // 计划编号 MP-001
  deviceId: string    // 设备编号(关联 DEVICES)
  deviceName: string  // 设备名称(冗余存储,列表直接显示)
  type: PlanType      // 维护类型
  content: string     // 维护内容
  cycleDays: number   // 周期(天)
  nextDate: string    // 下次维护日期 YYYY-MM-DD
  lastDate: string    // 上次维护日期(没做过为空字符串)
  owner: string       // 负责人
  paused: boolean     // 是否停用
  createdAt: string   // 创建时间
}

/** 派生状态:不落库,按日期现算,避免"昨天还是即将到期"这类脏数据 */
export type PlanStatus = 'paused' | 'overdue' | 'soon' | 'ok'

export const PLAN_STATUS_META: Record<PlanStatus, { label: string; color: string }> = {
  paused:  { label: '已停用',   color: 'gray' },
  overdue: { label: '已逾期',   color: 'red' },
  soon:    { label: '即将到期', color: 'orange' },
  ok:      { label: '正常',     color: 'green' },
}

/** 计划状态:停用优先,其次比日期(相差 <= 7 天算即将到期) */
export function planStatus(p: MaintenancePlan): PlanStatus {
  if (p.paused) return 'paused'
  const today = formatDate(new Date())
  if (p.nextDate < today) return 'overdue'
  return daysUntil(p.nextDate) <= 7 ? 'soon' : 'ok'
}

/** 距下次维护还有几天(负数=已逾期) */
export function daysUntil(dateStr: string): number {
  const today = formatDate(new Date())
  const toNum = (s: string) => new Date(s + 'T00:00:00').getTime()
  return Math.round((toNum(dateStr) - toNum(today)) / 86400000)
}

/* ============= 读写 ============= */

/** 把"今天 + n 天"写成 YYYY-MM-DD 的种子辅助 */
function seedDate(n: number): string {
  return dateAfterDays(n)
}

function seedPlans(): MaintenancePlan[] {
  const mk = (
    id: string,
    deviceId: string,
    deviceName: string,
    type: PlanType,
    content: string,
    cycleDays: number,
    nextInDays: number,
    owner: string,
  ): MaintenancePlan => ({
    id,
    deviceId,
    deviceName,
    type,
    content,
    cycleDays,
    nextDate: seedDate(nextInDays),
    lastDate: seedDate(nextInDays - cycleDays),
    owner,
    paused: false,
    createdAt: nowStr(),
  })

  return [
    // 故意放一条已逾期、两条即将到期,让演示时三种状态都能看到
    mk('MP-001', 'EQ-1005', '数控磨床 GM-720',   '例行保养', '更换润滑油、检查主轴精度', 30, -3,  '王伟'),
    mk('MP-002', 'EQ-1009', '注塑机 IM-450',     '巡检',     '检查液压油温与压力表读数', 15, 2,   '郑爽'),
    mk('MP-003', 'EQ-1016', '喷涂机器人 SP-300', '点检',     '检查喷枪雾化与喷涂轨迹',   7,  5,   '马涛'),
    mk('MP-004', 'EQ-1001', '数控机床 CK-216',   '例行保养', '清理导轨、补充切削液',     60, 12,  '王伟'),
    mk('MP-005', 'EQ-1013', '六轴机器人 RB-6A',  '点检',     '检查关节减速机润滑状态',   15, 21,  '林峰'),
    mk('MP-006', 'EQ-1018', '空气压缩机 AC-100', '例行保养', '更换空滤、检查压力阀',     90, 35,  '宋洋'),
    mk('MP-007', 'EQ-1007', '数控镗床 TC-680',   '大修',     '导轨磨损修复、精度校准',   365, 48, '周婷'),
    mk('MP-008', 'EQ-1022', '三坐标测量仪 CMM-700', '巡检', '探针校准、气路检查',       30, 66,  '邓超'),
  ]
}

/** 读计划;读不到(第一次访问)就写入种子 */
export function loadPlans(): MaintenancePlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) return list as MaintenancePlan[]
    }
  } catch {
    // 解析失败也走种子分支
  }
  const seeded = seedPlans()
  savePlans(seeded)
  return seeded
}

/** 写回 localStorage */
export function savePlans(list: MaintenancePlan[]): void {
  localStorage.setItem(PLANS_KEY, JSON.stringify(list))
}

/* ============= 业务操作 ============= */

/** 下一个计划编号:MP- 后面三位递增 */
export function nextPlanId(list: MaintenancePlan[]): string {
  let max = 0
  list.forEach((p) => {
    const n = parseInt(String(p.id).replace('MP-', ''), 10)
    if (!Number.isNaN(n) && n > max) max = n
  })
  return `MP-${String(max + 1).padStart(3, '0')}`
}

/**
 * 完成本次维护:记录上次日期,并按周期顺延下次日期;
 * 已逾期的从"今天"起算,免得一完成又立刻变成逾期。
 */
export function completePlan(list: MaintenancePlan[], id: string): MaintenancePlan[] {
  const today = formatDate(new Date())
  const next = list.map((p) => {
    if (p.id !== id) return p
    const base = p.nextDate < today ? new Date() : new Date(p.nextDate + 'T00:00:00')
    base.setDate(base.getDate() + p.cycleDays)
    return { ...p, lastDate: today, nextDate: formatDate(base) }
  })
  savePlans(next)
  return next
}

/** 新增/更新计划(按 id 判断是新增还是改) */
export function upsertPlan(list: MaintenancePlan[], plan: MaintenancePlan): MaintenancePlan[] {
  const exists = list.some((p) => p.id === plan.id)
  const next = exists ? list.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...list]
  savePlans(next)
  return next
}

/** 删除计划 */
export function removePlan(list: MaintenancePlan[], id: string): MaintenancePlan[] {
  const next = list.filter((p) => p.id !== id)
  savePlans(next)
  return next
}

/** 停用 / 启用 */
export function togglePlan(list: MaintenancePlan[], id: string): MaintenancePlan[] {
  const next = list.map((p) => (p.id === id ? { ...p, paused: !p.paused } : p))
  savePlans(next)
  return next
}

/** 某台设备最近一次维护日期(设备详情页展示用;没有计划则返回空串) */
export function latestMaintenanceOf(deviceId: string): string {
  const dates = loadPlans()
    .filter((p) => p.deviceId === deviceId && p.lastDate)
    .map((p) => p.lastDate)
    .sort()
  return dates.length ? dates[dates.length - 1] : ''
}

/** 汇总:给列表页顶部的小卡片用 */
export function planSummary(list: MaintenancePlan[]) {
  const counts = { overdue: 0, soon: 0, ok: 0, paused: 0 }
  list.forEach((p) => { counts[planStatus(p)] += 1 })
  return { total: list.length, ...counts }
}
