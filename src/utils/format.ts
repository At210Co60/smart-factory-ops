/**
 * 通用工具：时间格式化
 *
 * 工单的创建时间/完成时间、操作日志时间都走这里，
 * 避免「工单列表」「创建工单」「工单详情」各写一份 padStart 拼字符串。
 */

/** 当前时间，格式 YYYY-MM-DD HH:mm */
export function nowStr(): string {
  return formatDateTime(new Date())
}

/** 把 Date 格式化成 YYYY-MM-DD HH:mm */
export function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 取日期部分 YYYY-MM-DD（用于按天分组统计） */
export function dateOf(s: string): string {
  return (s || '').slice(0, 10)
}

/** 今天的日期，格式 YYYY-MM-DD */
export function todayStr(): string {
  return formatDate(new Date())
}

/** 把 Date 格式化成 YYYY-MM-DD */
export function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 今天往后 n 天（负数就是往前）的日期，YYYY-MM-DD */
export function dateAfterDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return formatDate(d)
}

/** 两个 YYYY-MM-DD 相差几天（b - a，向后为正） */
export function daysBetween(a: string, b: string): number {
  const toNum = (s: string) => new Date(s + 'T00:00:00').getTime()
  return Math.round((toNum(b) - toNum(a)) / 86400000)
}

/** 当前登录账号，读不到就返回默认操作人 */
export function currentUser(): string {
  try {
    const auth = localStorage.getItem('fop_auth_v1')
    if (auth) {
      const u = JSON.parse(auth).user
      if (u) return String(u)
    }
  } catch {
    // localStorage 被禁用 / JSON 坏了:走默认值
  }
  return '系统管理员'
}
