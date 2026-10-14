<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// 平台名称：从环境变量读取（根目录 .env.development），读不到时用默认值
const appName = import.meta.env.VITE_APP_NAME || '智能工厂设备运维管理平台'

// 演示账号（页面上会直接写出来）
const DEMO_USER = 'admin123'
const DEMO_PASS = '123456'

// 本地存储的键名：登录态 / 记住账号 / 注册过的账号
const AUTH_KEY = 'fop_auth_v1'
const REMEMBER_KEY = 'remember_user'
const USERS_KEY = 'fop_users_v1'

const router = useRouter()

// 表单数据：账号、密码
const account = ref('')
const password = ref('')
// 两条红色提示，各自独立
const accountError = ref('')
const passwordError = ref('')
// 账号或密码错误时的整体提示
const authError = ref('')
// 记住账号、显示/隐藏密码
const rememberMe = ref(false)
const showPassword = ref(false)

// 当前的年月日时分，写成“2026-10-13 16:30”这种格式
function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 读取注册页存进去的账号列表
function getRegisteredUsers(): Array<{ user: string; password: string }> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 输入框内容变化时，清掉自己那条红色提示
function onAccountInput() {
  accountError.value = ''
  authError.value = ''
}

function onPasswordInput() {
  passwordError.value = ''
  authError.value = ''
}

// 点击登录：先校验，再比对账号密码，最后写登录态并跳转
function handleLogin() {
  accountError.value = account.value.trim() ? '' : '请输入账号'
  passwordError.value = password.value ? '' : '请输入密码'
  if (accountError.value || passwordError.value) return

  const user = account.value.trim()
  const isDemo = user === DEMO_USER && password.value === DEMO_PASS
  const isRegistered = getRegisteredUsers().some(
    (item) => item.user === user && item.password === password.value,
  )
  if (!isDemo && !isRegistered) {
    authError.value = '账号或密码错误'
    return
  }

  // 记住账号：只记账号，不记密码
  if (rememberMe.value) {
    localStorage.setItem(REMEMBER_KEY, user)
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }

  // 写登录态（路由守卫的判断依据），然后进首页
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user, loginAt: formatNow() }))
  router.push('/home')
}

// 页面加载时：本地有记住的账号就自动填上，勾选框打勾
onMounted(() => {
  const remembered = localStorage.getItem(REMEMBER_KEY)
  if (remembered) {
    account.value = remembered
    rememberMe.value = true
  }
})
</script>

<template>
  <div class="login-page">
    <!-- 左边：品牌区 -->
    <section class="brand">
      <svg
        class="brand-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3.2" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
      <h1 class="brand-title">{{ appName }}</h1>
      <p class="brand-slogan">设备台账 · 工单流转 · 运维数据一目了然</p>
      <p class="brand-foot">工业互联 · 设备上云 · 智能运维</p>
    </section>

    <!-- 右边：表单区 -->
    <section class="form-side">
      <form class="form-card" @submit.prevent="handleLogin">
        <h2 class="form-title">账号登录</h2>

        <!-- 账号 -->
        <div class="field">
          <input
            v-model="account"
            type="text"
            placeholder="请输入账号"
            @input="onAccountInput"
          />
          <p v-if="accountError" class="error">{{ accountError }}</p>
        </div>

        <!-- 密码：右侧带显示/隐藏的小按钮 -->
        <div class="field">
          <div class="password-box">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              @input="onPasswordInput"
            />
            <button
              type="button"
              class="toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
          <p v-if="passwordError" class="error">{{ passwordError }}</p>
        </div>

        <!-- 账号或密码错误 -->
        <p v-if="authError" class="error auth-error">{{ authError }}</p>

        <!-- 记住账号 -->
        <div class="remember-row">
          <label class="remember">
            <input v-model="rememberMe" type="checkbox" />
            <span>记住账号</span>
          </label>
        </div>

        <button type="submit" class="submit">登录</button>

        <!-- 演示账号直接写在页面上 -->
        <p class="demo-tip">演示账号：admin123 ｜ 密码：123456</p>

        <p class="register-tip">
          还没有账号？
          <RouterLink class="register-link" to="/register">立即注册</RouterLink>
        </p>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
}

/* 左侧品牌区 */
.brand {
  flex: 1.1;
  background: linear-gradient(140deg, #1e6fd9, #10305f);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 32px;
  text-align: center;
  position: relative;
}

.brand-icon {
  width: 64px;
  height: 64px;
}

.brand-title {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #fff;
}

.brand-slogan {
  font-size: 15px;
  opacity: 0.92;
}

.brand-foot {
  position: absolute;
  bottom: 28px;
  left: 0;
  right: 0;
  font-size: 13px;
  letter-spacing: 2px;
  opacity: 0.72;
}

/* 右侧表单区 */
.form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.form-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 36px 32px;
  box-shadow: 0 12px 32px rgba(16, 48, 95, 0.08);
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 24px;
}

.field {
  margin-bottom: 14px;
}

.field input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-main);
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(30, 111, 217, 0.12);
}

.password-box {
  position: relative;
}

.password-box input {
  padding-right: 56px;
}

.toggle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  padding: 6px 8px;
  cursor: pointer;
}

.error {
  color: #d93025;
  font-size: 13px;
  margin: 6px 0 0;
  text-align: left;
}

.auth-error {
  margin: 2px 0 10px;
}

.remember-row {
  display: flex;
  align-items: center;
  margin: 4px 0 18px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-sub);
  cursor: pointer;
}

.remember input {
  width: 15px;
  height: 15px;
  accent-color: var(--primary);
  cursor: pointer;
}

.submit {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit:hover {
  background: #1a63c4;
}

.submit:active {
  background: #175aad;
}

.demo-tip {
  margin: 16px 0 0;
  text-align: center;
  font-size: 12px;
  color: #98a6bb;
}

.register-tip {
  margin: 10px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-sub);
}

.register-link {
  color: var(--primary);
}

.register-link:hover {
  text-decoration: underline;
}

/* 窄屏：左右分栏改成上下布局 */
@media (max-width: 860px) {
  .login-page {
    flex-direction: column;
  }

  .brand {
    flex: none;
    padding: 36px 20px;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-foot {
    position: static;
  }
}
</style>
