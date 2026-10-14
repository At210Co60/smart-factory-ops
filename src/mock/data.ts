/**
 * 模拟数据文件
 *
 * 设计原则:
 * - 设备是只读台账,直接写成固定数组(24 条)
 * - 工单是"活"数据(会创建、会流转),存在浏览器 localStorage 里,
 *   改完要能存下来,刷新页面才不丢
 *
 * 命名固定,后面四个业务页面从这里取数据,导出名一个都不能改
 */

/* ============= 设备状态/类型相关 ============= */

/** 设备状态映射:状态 key -> {中文文字, 颜色类名(对应 .tag-green / .tag-red / .tag-gray / .tag-orange)} */
export const DEVICE_STATUS: Record<string, { label: string; color: string }> = {
  running:  { label: '运行',   color: 'green' },
  fault:    { label: '故障',   color: 'red' },
  stopped:  { label: '停机',   color: 'gray' },
  maintain: { label: '维护中', color: 'orange' },
}

/** 设备接口 */
export interface Device {
  id: string         // 设备编号,如 EQ-1001
  name: string       // 设备名称
  type: string       // 类型:数控机床 / 注塑机 / 工业机器人 / 动力设备 / 检测设备
  shop: string       // 所在车间:一号 / 二号 / 三号车间
  model: string      // 型号
  owner: string      // 负责人(中文姓名)
  startDate: string  // 投产日期 YYYY-MM-DD
  lastMaint: string  // 最近保养日期 YYYY-MM-DD
  status: 'running' | 'fault' | 'stopped' | 'maintain'
}

/** 24 条设备台账,编号 EQ-1001 ~ EQ-1024 连续递增 */
export const DEVICES: Device[] = [
  // ── 数控机床 7 台:EQ-1001~EQ-1007
  { id: 'EQ-1001', name: '数控机床 CK-216',     type: '数控机床',  shop: '一号车间', model: 'CK-216', owner: '王伟', startDate: '2022-03-15', lastMaint: '2026-09-12', status: 'running' },
  { id: 'EQ-1002', name: '数控加工中心 MC-850', type: '数控机床',  shop: '一号车间', model: 'MC-850', owner: '李娜', startDate: '2022-06-20', lastMaint: '2026-08-30', status: 'running' },
  { id: 'EQ-1003', name: '数控车床 CL-360',     type: '数控机床',  shop: '二号车间', model: 'CL-360', owner: '张静', startDate: '2023-01-10', lastMaint: '2026-09-25', status: 'stopped' },
  { id: 'EQ-1004', name: '数控铣床 MX-540',     type: '数控机床',  shop: '二号车间', model: 'MX-540', owner: '刘强', startDate: '2023-04-18', lastMaint: '2026-10-05', status: 'running' },
  { id: 'EQ-1005', name: '数控磨床 GM-720',     type: '数控机床',  shop: '三号车间', model: 'GM-720', owner: '陈勇', startDate: '2024-02-22', lastMaint: '2026-09-18', status: 'fault' },
  { id: 'EQ-1006', name: '数控钻床 ZK-450',     type: '数控机床',  shop: '一号车间', model: 'ZK-450', owner: '赵磊', startDate: '2024-07-08', lastMaint: '2026-10-02', status: 'running' },
  { id: 'EQ-1007', name: '数控镗床 TC-680',     type: '数控机床',  shop: '三号车间', model: 'TC-680', owner: '周婷', startDate: '2025-03-14', lastMaint: '2026-09-28', status: 'maintain' },

  // ── 注塑机 5 台:EQ-1008~EQ-1012(名称含"注塑"两字)
  { id: 'EQ-1008', name: '注塑机 IM-320',       type: '注塑机',    shop: '一号车间', model: 'IM-320', owner: '吴军', startDate: '2022-08-25', lastMaint: '2026-09-15', status: 'running' },
  { id: 'EQ-1009', name: '注塑机 IM-450',       type: '注塑机',    shop: '二号车间', model: 'IM-450', owner: '郑爽', startDate: '2023-03-12', lastMaint: '2026-08-22', status: 'fault' },
  { id: 'EQ-1010', name: '注塑机 IM-280',       type: '注塑机',    shop: '一号车间', model: 'IM-280', owner: '孙浩', startDate: '2023-09-05', lastMaint: '2026-10-08', status: 'running' },
  { id: 'EQ-1011', name: '注塑机 IM-520',       type: '注塑机',    shop: '二号车间', model: 'IM-520', owner: '朱琳', startDate: '2024-05-18', lastMaint: '2026-09-30', status: 'stopped' },
  { id: 'EQ-1012', name: '注塑机 IM-380',       type: '注塑机',    shop: '三号车间', model: 'IM-380', owner: '胡明', startDate: '2025-01-20', lastMaint: '2026-10-01', status: 'running' },

  // ── 工业机器人 5 台:EQ-1013~EQ-1017
  { id: 'EQ-1013', name: '六轴机器人 RB-6A',    type: '工业机器人', shop: '一号车间', model: 'RB-6A',  owner: '林峰', startDate: '2022-11-08', lastMaint: '2026-09-20', status: 'running' },
  { id: 'EQ-1014', name: '焊接机器人 WS-200',   type: '工业机器人', shop: '二号车间', model: 'WS-200', owner: '黄刚', startDate: '2023-02-14', lastMaint: '2026-09-05', status: 'running' },
  { id: 'EQ-1015', name: '搬运机器人 TR-150',   type: '工业机器人', shop: '三号车间', model: 'TR-150', owner: '徐华', startDate: '2023-07-22', lastMaint: '2026-09-10', status: 'running' },
  { id: 'EQ-1016', name: '喷涂机器人 SP-300',   type: '工业机器人', shop: '一号车间', model: 'SP-300', owner: '马涛', startDate: '2024-04-30', lastMaint: '2026-08-15', status: 'fault' },
  { id: 'EQ-1017', name: '装配机器人 AS-180',   type: '工业机器人', shop: '二号车间', model: 'AS-180', owner: '罗斌', startDate: '2023-08-08', lastMaint: '2026-10-05', status: 'running' },

  // ── 动力设备 4 台:EQ-1018~EQ-1021
  { id: 'EQ-1018', name: '空气压缩机 AC-100',   type: '动力设备',  shop: '三号车间', model: 'AC-100', owner: '宋洋', startDate: '2022-05-10', lastMaint: '2026-09-22', status: 'running' },
  { id: 'EQ-1019', name: '液压动力站 HP-50',    type: '动力设备',  shop: '一号车间', model: 'HP-50',  owner: '韩磊', startDate: '2023-08-15', lastMaint: '2026-09-28', status: 'stopped' },
  { id: 'EQ-1020', name: '冷却水塔 CT-200',     type: '动力设备',  shop: '二号车间', model: 'CT-200', owner: '唐杰', startDate: '2024-11-20', lastMaint: '2026-10-03', status: 'running' },
  { id: 'EQ-1021', name: '配电柜 PG-400',       type: '动力设备',  shop: '三号车间', model: 'PG-400', owner: '冯超', startDate: '2024-12-05', lastMaint: '2026-09-08', status: 'maintain' },

  // ── 检测设备 3 台:EQ-1022~EQ-1024
  { id: 'EQ-1022', name: '三坐标测量仪 CMM-700', type: '检测设备',  shop: '一号车间', model: 'CMM-700', owner: '邓超', startDate: '2022-09-18', lastMaint: '2026-09-25', status: 'running' },
  { id: 'EQ-1023', name: '影像测量仪 VM-300',    type: '检测设备',  shop: '二号车间', model: 'VM-300',  owner: '彭丽', startDate: '2023-06-12', lastMaint: '2026-10-02', status: 'running' },
  { id: 'EQ-1024', name: '激光测距仪 LD-150',    type: '检测设备',  shop: '三号车间', model: 'LD-150',  owner: '田亮', startDate: '2024-10-08', lastMaint: '2026-10-06', status: 'running' },
]

/* ============= 工单状态/优先级 ============= */

/** 工单状态映射 */
export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: '待处理', color: 'orange' },
  processing: { label: '处理中', color: 'blue' },
  done:       { label: '已完成', color: 'green' },
}

/** 优先级映射 */
export const PRIORITY: Record<string, { label: string; color: string }> = {
  high: { label: '高', color: 'red' },
  mid:  { label: '中', color: 'orange' },
  low:  { label: '低', color: 'green' },
}

/** 工单接口 */
export interface WorkOrder {
  no: string         // 工单号 WO-YYYYMMDDNNN
  deviceId: string   // 关联设备编号
  deviceName: string // 关联设备名称(冗余存储,显示不用再回查)
  desc: string       // 故障描述(5-30 字中文)
  priority: 'high' | 'mid' | 'low'
  status: 'pending' | 'processing' | 'done'
  createTime: string // 创建时间 YYYY-MM-DD HH:mm
  finishTime: string // 完成时间(已完成工单填,其他空字符串)
}

/* ============= 种子工单 12 条 =====================
 * 状态分布:待处理 5 / 处理中 3 / 已完成 4
 * 全部集中在 2026-10-13 一天,序号 001~012
 * deviceName 与 DEVICES 里对应 id 的 name 完全一致(★一票否决)
 * =============================================== */
const SEED_ORDERS: WorkOrder[] = [
  // 待处理 5 条
  { no: 'WO-261013001', deviceId: 'EQ-1005', deviceName: '数控磨床 GM-720',     desc: '主轴异响,加工精度超差', priority: 'high', status: 'pending',    createTime: '2026-10-13 08:23', finishTime: '' },
  { no: 'WO-261013002', deviceId: 'EQ-1009', deviceName: '注塑机 IM-450',       desc: '液压油温过高报警',       priority: 'mid',  status: 'pending',    createTime: '2026-10-13 09:15', finishTime: '' },
  { no: 'WO-261013003', deviceId: 'EQ-1016', deviceName: '喷涂机器人 SP-300',   desc: '喷涂臂抖动,轨迹偏移',   priority: 'low',  status: 'pending',    createTime: '2026-10-13 10:08', finishTime: '' },
  { no: 'WO-261013004', deviceId: 'EQ-1003', deviceName: '数控车床 CL-360',     desc: '刀库卡顿,换刀失败',     priority: 'high', status: 'pending',    createTime: '2026-10-13 11:42', finishTime: '' },
  { no: 'WO-261013005', deviceId: 'EQ-1019', deviceName: '液压动力站 HP-50',    desc: '液压站漏油,压力不稳',   priority: 'mid',  status: 'pending',    createTime: '2026-10-13 13:30', finishTime: '' },
  // 处理中 3 条
  { no: 'WO-261013006', deviceId: 'EQ-1007', deviceName: '数控镗床 TC-680',     desc: '导轨磨损,需更换',       priority: 'high', status: 'processing', createTime: '2026-10-13 14:18', finishTime: '' },
  { no: 'WO-261013007', deviceId: 'EQ-1011', deviceName: '注塑机 IM-520',       desc: '温控系统失灵',           priority: 'low',  status: 'processing', createTime: '2026-10-13 15:06', finishTime: '' },
  { no: 'WO-261013008', deviceId: 'EQ-1021', deviceName: '配电柜 PG-400',       desc: '配电柜接触不良',         priority: 'mid',  status: 'processing', createTime: '2026-10-13 16:25', finishTime: '' },
  // 已完成 4 条
  { no: 'WO-261013009', deviceId: 'EQ-1002', deviceName: '数控加工中心 MC-850', desc: '刀位计数器偏差',         priority: 'mid',  status: 'done',       createTime: '2026-10-13 08:45', finishTime: '2026-10-13 16:30' },
  { no: 'WO-261013010', deviceId: 'EQ-1006', deviceName: '数控钻床 ZK-450',     desc: '冷却液泵异响',           priority: 'high', status: 'done',       createTime: '2026-10-13 09:32', finishTime: '2026-10-13 17:00' },
  { no: 'WO-261013011', deviceId: 'EQ-1004', deviceName: '数控铣床 MX-540',     desc: 'X轴定位精度下降',       priority: 'low',  status: 'done',       createTime: '2026-10-13 10:50', finishTime: '2026-10-13 17:30' },
  { no: 'WO-261013012', deviceId: 'EQ-1022', deviceName: '三坐标测量仪 CMM-700', desc: '测量探针校准偏差',     priority: 'mid',  status: 'done',       createTime: '2026-10-13 11:20', finishTime: '2026-10-13 18:00' },
]

/* ============= localStorage 读写 ============= */

/** localStorage 键名(版本号后缀,以后改结构时可避免老数据冲突) */
const ORDERS_KEY = 'fop_orders_v1'

/** 从 localStorage 读工单;读不到(第一次访问)就写入 12 条种子再返回 */
export function loadOrders(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (raw) {
      const list = JSON.parse(raw) as WorkOrder[]
      if (Array.isArray(list)) return list
    }
  } catch {
    // JSON 解析失败也走种子写入分支
  }
  // 第一次访问 / 解析失败:写入种子并返回
  saveOrders(SEED_ORDERS)
  return SEED_ORDERS
}

/** 把工单数组写回 localStorage */
export function saveOrders(list: WorkOrder[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list))
}