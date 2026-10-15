<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 平台名称从环境变量读取（见根目录 .env.development）
const appName = import.meta.env.VITE_APP_NAME || '智能工厂设备运维管理平台'

// 左侧菜单：一个模块一项
// 注意顺序：find 取第一个 match，所以 /order/create 必须排在 /order/list 前面，
// 否则它会被"工单管理"先截胡（两者都以 /order 开头）
const menus = [
  { path: '/home', label: '数据看板', match: ['/home'] },
  // 设备模块的两个页面（列表 + 详情）都归到"设备台账"
  { path: '/device/list', label: '设备台账', match: ['/device'] },
  { path: '/plan/list', label: '维护计划', match: ['/plan'] },
  { path: '/spare/list', label: '备件库存', match: ['/spare'] },
  // 工单模块:创建单独一项,其余(列表 + 详情)归"工单管理"
  { path: '/order/create', label: '创建工单', match: ['/order/create'] },
  { path: '/order/list', label: '工单管理', match: ['/order'] },
]

const route = useRoute()
const router = useRouter()

// 顶部栏显示当前页面的标题
const pageTitle = computed(() => (route.meta.title as string) || '')

// 菜单高亮:按模块前缀判断,而不是交给 RouterLink 的 activeClass。
// 原因:详情页和列表页在路由表里是兄弟节点,内置判断只在"同一路由记录"时成立,
// 所以 /order/detail/:no 里"工单管理"不会亮。这里改成正则匹配模块前缀,
// 末尾的 (\/|$) 保证 /order 不会误匹配到 /orderxxx 这种同前缀的其它路径。
function isMenuActive(item: { match: string[] }) {
  return item.match.some((m) => new RegExp(`^${m}(/|$)`).test(route.path))
}

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
          <RouterLink
            v-for="item in menus"
            :key="item.path"
            :to="item.path"
            class="menu-item"
            :class="{ active: isMenuActive(item) }"
          >
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

/* 当前页高亮:菜单项自身带 .active,不再依赖 router-link-active */
.menu-item.active {
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

/* 手机端:220px 的固定侧栏会把内容区挤到放不下(390px 屏只剩 170px),
   这里把侧栏收窄成窄条并缩小内边距,内容区才有可用宽度 */
@media (max-width: 720px) {
  .sidebar {
    width: 84px;
  }
  .brand {
    padding: 14px 8px;
    font-size: 12px;
    line-height: 1.4;
    text-align: center;
  }
  .menu-item {
    padding: 10px 8px;
    font-size: 12px;
    text-align: center;
    line-height: 1.4;
  }
  .topbar {
    padding: 0 12px;
  }
  .content {
    padding: 12px;
  }
}
</style>
