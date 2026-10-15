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

// 给 axios 的 config 挂一个自定义字段:记录"这次请求自己的" AbortController,
// 后续响应/取消回调靠它做身份比对,避免误删同 key 新请求的 controller
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _controller?: AbortController
  }
}

// ===== 实例:统一 baseURL / 超时 =====
const request = axios.create({
  timeout: 15000,
})

// ===== 请求取消:用 AbortController =====
/** 用 method + url 当 key,未完成时再次相同请求会被自动 abort */
const pendingControllers = new Map<string, AbortController>()

function getRequestKey(config: InternalAxiosRequestConfig): string {
  const method = (config.method || 'get').toUpperCase()
  // 只用 method + url,不带 params(避免"同一个接口换参数"被当成两个不同请求)
  return `${method}_${config.url || ''}`
}

/** 取消并移除 map 里当前的 controller(发起新请求时用,语义就是"把上次的顶掉") */
function abortPending(key: string) {
  const c = pendingControllers.get(key)
  if (c) {
    c.abort()
    pendingControllers.delete(key)
  }
}

/**
 * 从 map 里摘掉"这次请求自己的" controller。
 *
 * 关键:不能无条件按 key 删。同 key 的新请求 B 发出时会覆盖 map 里的 controller,
 * 此时旧请求 A 的响应/取消回调如果还按 key 删,删掉的就是 B 的 —— B 从此不可取消,
 * 而且下一次请求的 abort 会落空(表现为:连按两次回车切城市,后一次请求被静默取消,
 * 看板留着旧城市数据且不报错)。
 * 所以拿 config 上挂着的那一个来比对身份,只删自己。
 */
function releaseController(config: InternalAxiosRequestConfig) {
  const key = getRequestKey(config)
  if (pendingControllers.get(key) === config._controller) {
    pendingControllers.delete(key)
  }
}

// ===== 请求拦截器 =====
request.interceptors.request.use((config) => {
  const key = getRequestKey(config)
  // 取消上一次的相同请求,避免快速切换时数据错乱
  abortPending(key)
  // 创建本次请求的 controller,同时挂到 config.signal 和 config._controller:
  // signal 给 axios 用,_controller 留着自己做身份比对
  const controller = new AbortController()
  config.signal = controller.signal
  config._controller = controller
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
    // 请求完成:只摘掉自己那个 controller(不能按 key 无脑删,可能已经是新请求的了)
    releaseController(response.config)

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
    // 失败/取消同样只摘掉自己那个,否则会误删同 key 新请求的 controller
    if (error?.config) {
      releaseController(error.config)
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