<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 平台名称：从环境变量读取（根目录 .env.development），读不到时用默认值
const appName = import.meta.env.VITE_APP_NAME || '智能工厂设备运维管理平台'

// 演示账号不允许被重复注册
const DEMO_USER = 'admin123'
// 注册过的账号存在这个键名里，登录页也会读它
const USERS_KEY = 'fop_users_v1'

const router = useRouter()

// 表单数据：账号、密码、确认密码
const account = ref('')
const password = ref('')
const confirm = ref('')
// 三条红色提示，各自独立
const accountError = ref('')
const passwordError = ref('')
const confirmError = ref('')
// 注册成功后的绿色提示
const successTip = ref('')
// 显示/隐藏密码
const showPassword = ref(false)

// 读取已经注册过的账号列表
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
}

function onPasswordInput() {
  passwordError.value = ''
}

function onConfirmInput() {
  confirmError.value = ''
}

// 点击注册：逐项校验，通过后存进 localStorage，跳回登录页
function handleRegister() {
  const user = account.value.trim()
  accountError.value = ''
  passwordError.value = ''
  confirmError.value = ''

  if (!user) {
    accountError.value = '请输入账号'
  } else if (user === DEMO_USER || getRegisteredUsers().some((item) => item.user === user)) {
    accountError.value = '该账号已被注册'
  }
  if (!password.value) {
    passwordError.value = '请输入密码'
  } else if (password.value.length < 6) {
    passwordError.value = '密码长度不能少于 6 位'
  }
  if (!confirm.value) {
    confirmError.value = '请再次输入密码'
  } else if (confirm.value !== password.value) {
    confirmError.value = '两次输入的密码不一致'
  }
  if (accountError.value || passwordError.value || confirmError.value) return

  const users = getRegisteredUsers()
  users.push({ user, password: password.value })
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  // 给用户看一眼成功提示，再把页面切到登录页
  successTip.value = '注册成功，即将跳转登录页…'
  setTimeout(() => {
    router.push('/login')
  }, 1000)
}
</script>

<template>
  <div class="register-page">
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
      <form class="form-card" @submit.prevent="handleRegister">
        <h2 class="form-title">注册账号</h2>

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
              placeholder="请输入密码（至少 6 位）"
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

        <!-- 确认密码 -->
        <div class="field">
          <input
            v-model="confirm"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
            @input="onConfirmInput"
          />
          <p v-if="confirmError" class="error">{{ confirmError }}</p>
        </div>

        <button type="submit" class="submit">注册</button>

        <p v-if="successTip" class="success">{{ successTip }}</p>

        <p class="login-tip">
          已有账号？
          <RouterLink class="login-link" to="/login">返回登录</RouterLink>
        </p>
      </form>
    </section>
  </div>
</template>

<style scoped>
.register-page {
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

.success {
  color: #1a9e4b;
  font-size: 13px;
  margin: 12px 0 0;
  text-align: center;
}

.submit {
  width: 100%;
  height: 44px;
  margin-top: 6px;
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

.login-tip {
  margin: 14px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-sub);
}

.login-link {
  color: var(--primary);
}

.login-link:hover {
  text-decoration: underline;
}

/* 窄屏：左右分栏改成上下布局 */
@media (max-width: 860px) {
  .register-page {
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
