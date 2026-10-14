<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 平台名称从环境变量读取（见根目录 .env.development）
const appName = import.meta.env.VITE_APP_NAME || '智能工厂设备运维管理平台'

// 左侧菜单：一个模块一项
const menus = [
  { path: '/home', label: '数据看板' },
  { path: '/device/list', label: '设备台账' },
  { path: '/order/list', label: '工单管理' },
  { path: '/order/create', label: '创建工单' },
]

const route = useRoute()
const router = useRouter()

// 顶部栏显示当前页面的标题
const pageTitle = computed(() => (route.meta.title as string) || '')

// 当前登录账号：从登录态里取，取不到就不显示
let userName = ''
try {
  const auth = localStorage.getItem('fop_auth_v1')
  if (auth) userName = JSON.parse(auth).user || ''
} catch {
  userName = ''
}

// 退出登录：清掉登录态，回到登录页
function handleLogout() {
  localStorage.removeItem('fop_auth_v1')
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <!-- 左侧菜单 -->
    <aside class="sidebar">
      <div class="brand">{{ appName }}</div>
      <nav class="menu">
        <RouterLink v-for="item in menus" :key="item.path" :to="item.path" class="menu-item">
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="main">
      <!-- 顶部栏 -->
      <header class="topbar">
        <span class="page-title">{{ pageTitle }}</span>
        <div class="user-area">
          <span v-if="userName" class="user-name">当前用户：{{ userName }}</span>
          <button type="button" class="logout" @click="handleLogout">退出登录</button>
        </div>
      </header>

      <!-- 页面内容出口 -->
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #10305f;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}

.brand {
  padding: 20px 16px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
}

.menu-item {
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.menu-item.router-link-active {
  background: var(--primary);
  color: #fff;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e6ecf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  color: var(--text-sub);
  font-size: 13px;
}

.logout {
  border: 1px solid #d8e1ee;
  background: #fff;
  color: var(--text-main);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.logout:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.content {
  flex: 1;
  padding: 20px 24px;
}
</style>
