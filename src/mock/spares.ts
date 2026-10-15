/**
 * 备件库存本地存储
 *
 * 解决的真实问题:工单派下去才发现"没件可换",维修等料。
 * 每类备件挂在设备类型下(数控机床/注塑机/…),所以设备详情页能直接反查
 * "这台设备可能要用的备件现在够不够"。
 *
 * 库存状态(缺货/低库存/正常)不落库,按数量和安全库存现算。
 */

import { currentUser, formatDate, nowStr } from '@/utils/format'

const SPARES_KEY = 'fop_spares_v1'

/** 安全库存默认值(新增备件时给个合理起点) */
export const DEFAULT_SAFETY_STOCK = 3

export interface SpareMovement {
  type: 'in' | 'out'       // 入库 / 出库
  qty: number              // 数量
  time: string             // YYYY-MM-DD HH:mm
  operator: string         // 经办人
  note: string             // 备注(出库一般写流向,如工单号)
}

export interface SparePart {
  code: string             // 备件编号 SP-001
  name: string             // 备件名称
  spec: string             // 规格型号
  deviceType: string       // 适配备件类型(对应 DEVICES.type)
  qty: number              // 当前库存
  safetyStock: number      // 安全库存,低于它是"低库存",为 0 是"缺货"
  unit: string             // 单位
  location: string         // 库位
  movements: SpareMovement[] // 出入库流水(按时间正序)
}

/** 派生状态:缺货 = 0;低库存 = 低于安全库存;其余正常 */
export type SpareStatus = 'out' | 'low' | 'ok'

export const SPARE_STATUS_META: Record<SpareStatus, { label: string; color: string }> = {
  out: { label: '缺货',   color: 'red' },
  low: { label: '低库存', color: 'orange' },
  ok:  { label: '正常',   color: 'green' },
}

export function spareStatus(s: SparePart): SpareStatus {
  if (s.qty <= 0) return 'out'
  return s.qty < s.safetyStock ? 'low' : 'ok'
}

/* ============= 读写 ============= */

/** 种子数据里的流水时间:近几天分布,别全挤在同一分钟 */
function daysAgoTime(n: number, hm: string): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  // 必须用 formatDate(本地时区)取日期,不能用 toISOString() 再 slice:
  // toISOString() 转的是 UTC,UTC+8 用户在凌晨 0:00-08:00 打开页面时,
  // 会被算成前一天,导致整批种子流水日期整体偏移一天。
  return `${formatDate(d)} ${hm}`
}

function seedSpares(): SparePart[] {
  const mk = (
    code: string,
    name: string,
    spec: string,
    deviceType: string,
    qty: number,
    safetyStock: number,
    unit: string,
    location: string,
    movements: SpareMovement[],
  ): SparePart => ({ code, name, spec, deviceType, qty, safetyStock, unit, location, movements })

  return [
    mk('SP-001', '主轴电机', 'YZ-2200 3kW', '数控机床', 2, 2, '台', 'A区-01-03', [
      { type: 'in',  qty: 4, time: daysAgoTime(20, '09:30'), operator: '李库管', note: '季度采购入库' },
      { type: 'out', qty: 2, time: daysAgoTime(6, '14:20'),  operator: '周婷',   note: '用于 WO-261013006 数控镗床' },
    ]),
    mk('SP-002', '液压密封件套件', 'HS-45 全套', '注塑机', 6, 4, '套', 'A区-02-01', [
      { type: 'in',  qty: 10, time: daysAgoTime(18, '10:05'), operator: '李库管', note: '常规补货' },
      { type: 'out', qty: 4,  time: daysAgoTime(4, '16:40'),  operator: '郑爽',   note: '用于 IM-450 液压维修' },
    ]),
    mk('SP-003', '接近开关', 'LJ12A3-4-Z/BX', '工业机器人', 25, 10, '个', 'B区-01-02', [
      { type: 'in', qty: 30, time: daysAgoTime(12, '11:15'), operator: '李库管', note: '批量采购' },
      { type: 'out', qty: 5, time: daysAgoTime(3, '09:10'),  operator: '马涛',   note: '喷涂机器人限位更换' },
    ]),
    mk('SP-004', '轴承 6205-2RS', '6205-2RS', '动力设备', 8, 6, '个', 'B区-02-04', [
      { type: 'in',  qty: 12, time: daysAgoTime(9, '15:30'), operator: '李库管', note: '到货验收合格' },
      { type: 'out', qty: 4,  time: daysAgoTime(2, '13:45'), operator: '宋洋',   note: '空压机保养更换' },
    ]),
    mk('SP-005', 'PLC 数字量模块', 'DI-16 通道', '数控机床', 1, 2, '块', 'C区-01-01', [
      { type: 'in',  qty: 2, time: daysAgoTime(25, '10:00'), operator: '李库管', note: '年初备货' },
      { type: 'out', qty: 1, time: daysAgoTime(5, '17:20'),  operator: '王伟',   note: 'CK-216 电控柜更换' },
    ]),
    mk('SP-006', '精密探针', 'φ3×40 红宝石', '检测设备', 0, 2, '支', 'C区-02-03', [
      { type: 'in',  qty: 3, time: daysAgoTime(15, '09:00'), operator: '李库管', note: '精密件单独存放' },
      { type: 'out', qty: 3, time: daysAgoTime(1, '11:30'),  operator: '邓超',   note: 'CMM-700 探针断裂更换' },
    ]),
  ]
}

/** 读备件;读不到(第一次访问)就写入种子 */
export function loadSpares(): SparePart[] {
  try {
    const raw = localStorage.getItem(SPARES_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) return list as SparePart[]
    }
  } catch {
    // 解析失败也走种子分支
  }
  const seeded = seedSpares()
  saveSpares(seeded)
  return seeded
}

export function saveSpares(list: SparePart[]): void {
  localStorage.setItem(SPARES_KEY, JSON.stringify(list))
}

/* ============= 业务操作 ============= */

/** 下一个备件编号 SP-001 / SP-002 … */
export function nextSpareCode(list: SparePart[]): string {
  let max = 0
  list.forEach((s) => {
    const n = parseInt(String(s.code).replace('SP-', ''), 10)
    if (!Number.isNaN(n) && n > max) max = n
  })
  return `SP-${String(max + 1).padStart(3, '0')}`
}

/**
 * 入库 / 出库。
 * 出库数量超过现有库存时返回错误信息,不写库(由页面提示用户)。
 */
export function moveSpare(
  list: SparePart[],
  code: string,
  type: 'in' | 'out',
  qty: number,
  note: string,
): { ok: boolean; msg: string; list: SparePart[] } {
  const target = list.find((s) => s.code === code)
  if (!target) return { ok: false, msg: '备件不存在', list }
  // 必须是正整数:Number.isInteger 同时排除了 NaN/Infinity,
  // 少这一步的话 type="number" 输入 1.5 也能提交,库存会变成小数
  if (!Number.isInteger(qty) || qty <= 0) return { ok: false, msg: '数量必须是正整数', list }
  if (type === 'out' && qty > target.qty) {
    return { ok: false, msg: `库存不足:现有 ${target.qty} ${target.unit}`, list }
  }

  const movement: SpareMovement = {
    type,
    qty,
    time: nowStr(),
    operator: currentUser(),
    note: note.trim() || (type === 'in' ? '采购入库' : '领用出库'),
  }

  const next = list.map((s) =>
    s.code === code
      ? { ...s, qty: type === 'in' ? s.qty + qty : s.qty - qty, movements: [...s.movements, movement] }
      : s,
  )
  saveSpares(next)
  return { ok: true, msg: '', list: next }
}

/** 新增 / 更新备件档案(库存数量走 moveSpare,不在这里改) */
export function upsertSpare(list: SparePart[], part: SparePart): SparePart[] {
  const exists = list.some((s) => s.code === part.code)
  const next = exists ? list.map((s) => (s.code === part.code ? part : s)) : [part, ...list]
  saveSpares(next)
  return next
}

/** 某类设备用到的备件(设备详情页反查用) */
export function sparesForDeviceType(deviceType: string): SparePart[] {
  return loadSpares().filter((s) => s.deviceType === deviceType)
}

/** 汇总:列表页顶部小卡片 */
export function spareSummary(list: SparePart[]) {
  const counts = { out: 0, low: 0, ok: 0 }
  list.forEach((s) => { counts[spareStatus(s)] += 1 })
  return { total: list.length, ...counts }
}
