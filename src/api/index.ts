/**
 * 统一的 axios 实例 + 拦截器
 *
 * 封装要点(对应文档 P1/P6 的设计取舍):
 * 1. 自动补天行 key:每次请求都从 .env.development 读 VITE_TIANAPI_KEY 注入到 params
 * 2. 自动判业务码:响应拦截器里判 res.data.code !== 200 直接 reject,业务错误走 catch 分支
 * 3. 自动取消上一次未完成的相同请求:用户快速切换城市时,上一次请求自动 abort,避免数据错乱
 * 4. 统一超时:15s 超时
 *
 * 用法:
 *   import request from '@/api'
 *   const res = await request.get('/tianapi/tianqi/index', { params: { city: '福州', type: 1 } })
 *   // res.data 已经是完整返回体 { code, msg, result }
 *   // 业务错误(非 200)已经进 reject,可以直接 catch(e => e.message)
 */

import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

// ===== 实例:统一 baseURL / 超时 =====
const request = axios.create({
  timeout: 15000,
})

// ===== 请求取消:用 AbortController =====
/** 用 method + url 当 key,未完成时再次相同请求会被自动 abort */
const pendingControllers = new Map<string, AbortController>()

function getRequestKey(config: InternalAxiosRequestConfig): string {
  const method = (config.method || 'get').toUpperCase()
  // 不带 params(避免重复请求但参数不同被误杀)
  return `${method}_${config.url || ''}`
}

/** 把 pendingControllers 里属于这次请求的 controller 取消并删除 */
function abortAndDelete(key: string) {
  const c = pendingControllers.get(key)
  if (c) {
    c.abort()
    pendingControllers.delete(key)
  }
}

// ===== 请求拦截器 =====
request.interceptors.request.use((config) => {
  const key = getRequestKey(config)
  // 取消上一次的相同请求,避免快速切换时数据错乱
  abortAndDelete(key)
  // 创建本次请求的 controller 并挂上 signal
  const controller = new AbortController()
  config.signal = controller.signal
  pendingControllers.set(key, controller)

  // 自动补 key:params 里没有 key 时注入
  const apiKey = import.meta.env.VITE_TIANAPI_KEY
  if (apiKey) {
    if (config.method?.toLowerCase() === 'get') {
      config.params = config.params || {}
      if (!config.params.key) config.params.key = apiKey
    } else {
      // POST:把 key 注入到表单体(URLSearchParams 或普通对象)
      if (config.params && typeof (config.params as URLSearchParams).append === 'function') {
        if (!(config.params as URLSearchParams).has('key')) {
          (config.params as URLSearchParams).append('key', apiKey)
        }
      } else if (config.params && !config.params.key) {
        config.params.key = apiKey
      }
      // 注意:axios 的 POST 默认 data 走请求体,这里为了简单统一把表单参数都放 params,
      // 如果需要严格遵守"查询/提交参数分离",请调用方把表单参数传 data
      // 此处兼容常见用法:res.params 既是 GET 查询参数,也是 POST 表单参数
    }
  }
  return config
})

// ===== 响应拦截器 =====
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 请求完成,从 pending 里删除
    const key = getRequestKey(response.config)
    abortAndDelete(key)

    const data: any = response.data
    // 天行接口约定:HTTP 永远是 200,业务状态码在 data.code
    // 如果响应里有 code 且不是 200,抛错让 catch 处理
    if (data && typeof data.code === 'number' && data.code !== 200) {
      const err: any = new Error(data.msg || `接口错误: ${data.code}`)
      err.code = data.code
      err.data = data
      return Promise.reject(err)
    }
    return response
  },
  (error) => {
    // pending 里也得清掉
    if (error?.config) {
      const key = getRequestKey(error.config)
      abortAndDelete(key)
    }
    // 用户主动取消(AbortController.abort)不算错,转成静默 reject
    if (axios.isCancel(error)) {
      // 用一个特殊 message,调用方可以选择不展示
      const err: any = new Error('请求已取消')
      err.silent = true
      return Promise.reject(err)
    }
    return Promise.reject(error)
  },
)

export default request