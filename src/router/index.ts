import { createRouter, createWebHistory } from 'vue-router'

// 路由表：路径、页面文件位置、页面标题、是否需要登录
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 登录页、注册页不要外壳，独立成页
    {
      path: '/login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/register',
      component: () => import('@/views/register/index.vue'),
      meta: { title: '注册' },
    },
    // 登录后的页面统一套 BasicLayout（左侧菜单 + 顶部栏）
    {
      path: '/',
      redirect: '/home',
      component: () => import('@/layouts/BasicLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        // 数据看板模块
        {
          path: 'home',
          component: () => import('@/views/home/index.vue'),
          meta: { title: '数据看板' },
        },
        // 设备管理模块
        {
          path: 'device/list',
          component: () => import('@/views/device/list.vue'),
          meta: { title: '设备台账' },
        },
        {
          path: 'device/detail/:id',
          component: () => import('@/views/device/detail.vue'),
          meta: { title: '设备详情' },
        },
        // 工单管理模块
        {
          path: 'order/list',
          component: () => import('@/views/order/list.vue'),
          meta: { title: '工单管理' },
        },
        {
          path: 'order/create',
          component: () => import('@/views/order/create.vue'),
          meta: { title: '创建工单' },
        },
      ],
    },
  ],
})

// 全局前置守卫：每次跳转前都会先跑一遍
router.beforeEach((to) => {
  const auth = localStorage.getItem('fop_auth_v1') // 读登录态
  if (to.meta.requiresAuth && !auth) {
    // 目标页要登录，但没登录，打回登录页
    return '/login'
  }
  if (to.path === '/login' && auth) {
    // 已登录还想进登录页，直接送进首页
    return '/home'
  }
  document.title = (to.meta.title as string) || '智能工厂设备运维管理平台'
})

export default router
