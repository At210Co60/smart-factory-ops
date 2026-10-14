<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DEVICES,
  loadOrders,
  saveOrders,
  type Device,
  type WorkOrder,
} from '@/mock/data'

const route = useRoute()
const router = useRouter()

/* ============= 表单状态 ============= */
// 已选中的设备(对象,不再变就锁住选项)
const selectedDevice = ref<Device | null>(null)
// 设备输入框文字(只在搜索态时生效)
const deviceKeyword = ref('')
// 是否显示设备下拉
const showDropdown = ref(false)
// 故障描述
const desc = ref('')
// 优先级(默认中)
const priority = ref<WorkOrder['priority']>('mid')
// 校验错误
const deviceError = ref('')
const descError = ref('')

/* ============= 设备下拉 ============= */
// 输入框输入时,实时匹配名称 / 编号,最多 8 条
const filteredDevices = computed<Device[]>(() => {
  const k = deviceKeyword.value.trim().toLowerCase()
  if (!k) return []
  return DEVICES.filter(
    (d) => d.name.toLowerCase().includes(k) || d.id.toLowerCase().includes(k),
  ).slice(0, 8)
})

function onDeviceInput() {
  // 输入框输入 → 还没确认选 → 进入搜索态(下拉显示)
  selectedDevice.value = null
  deviceError.value = ''
  showDropdown.value = true
}

function pickDevice(d: Device) {
  selectedDevice.value = d
  deviceKeyword.value = ''
  showDropdown.value = false
  deviceError.value = ''
}

function clearDevice() {
  selectedDevice.value = null
  deviceKeyword.value = ''
  deviceError.value = ''
}

/* ============= 描述 + 校验自动清除 ============= */
watch(desc, () => {
  if (descError.value && desc.value.length >= 5) descError.value = ''
})

/* ============= 从 URL ?deviceId= 进来,自动选中 ============= */
onMounted(() => {
  const qid = String(route.query.deviceId || '')
  if (qid) {
    const d = DEVICES.find((x) => x.id === qid)
    if (d) {
      selectedDevice.value = d
    }
  }
})

/* ============= 字数 ============= */
const descCount = computed(() => desc.value.length)

/* ============= 优先级三张卡片 ============= */
const priorityOptions: Array<{ key: WorkOrder['priority']; label: string; color: string }> = [
  { key: 'high', label: '高', color: 'red' },
  { key: 'mid',  label: '中', color: 'orange' },
  { key: 'low',  label: '低', color: 'green' },
]

/* ============= 提交 ============= */
function generateOrderNo(): string {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const prefix = `WO-${date}`
  const orders = loadOrders()
  let maxSeq = 0
  orders.forEach((o) => {
    if (o.no.startsWith(prefix)) {
      const seq = parseInt(o.no.slice(prefix.length), 10)
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
    }
  })
  const seq = String(maxSeq + 1).padStart(3, '0')
  return `${prefix}${seq}`
}

function nowStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function submit() {
  // 校验:选设备
  if (!selectedDevice.value) {
    deviceError.value = '请选择设备'
    // 让下拉重新可见,用户能继续操作
    showDropdown.value = true
  }
  // 校验:描述 5 字
  if (desc.value.trim().length < 5) {
    descError.value = '描述至少 5 个字'
  }
  if (!selectedDevice.value || desc.value.trim().length < 5) return

  const newOrder: WorkOrder = {
    no: generateOrderNo(),
    deviceId: selectedDevice.value.id,
    deviceName: selectedDevice.value.name,
    desc: desc.value.trim(),
    priority: priority.value,
    status: 'pending',
    createTime: nowStr(),
    finishTime: '',
  }

  // 插到列表最前面
  const list = [newOrder, ...loadOrders()]
  saveOrders(list)

  // 跳回工单列表
  router.push('/order/list')
}

function cancel() { router.push('/order/list') }
function goBack() { router.push('/order/list') }
</script>

<template>
  <section class="order-create">
    <!-- 顶部返回栏 -->
    <div class="head-row">
      <button class="back-btn" @click="goBack">← 返回工单列表</button>
    </div>

    <!-- 表单卡片 -->
    <div class="form-card">
      <h3 class="card-title">创建工单</h3>

      <!-- 选择设备 -->
      <div class="form-item">
        <label class="form-label">
          <span class="req">*</span>选择设备
        </label>

        <!-- 已选态:显示「编号 · 名称 · 车间」+ 清除 -->
        <div v-if="selectedDevice" class="selected-box">
          <span class="selected-text">
            {{ selectedDevice.id }} · {{ selectedDevice.name }} · {{ selectedDevice.shop }}
          </span>
          <button class="clear-btn" type="button" @click="clearDevice">清除</button>
        </div>

        <!-- 搜索态:输入框 + 下拉 -->
        <div v-else class="device-search">
          <input
            v-model="deviceKeyword"
            type="text"
            class="device-input"
            placeholder="按设备名称或编号搜索"
            @input="onDeviceInput"
            @focus="showDropdown = true"
          />
          <ul v-if="showDropdown && filteredDevices.length" class="dropdown">
            <li
              v-for="d in filteredDevices"
              :key="d.id"
              class="dropdown-item"
              @click="pickDevice(d)"
            >
              <span class="dropdown-id">{{ d.id }}</span>
              <span class="dropdown-name">{{ d.name }}</span>
              <span class="dropdown-shop">{{ d.shop }}</span>
            </li>
          </ul>
        </div>

        <p v-if="deviceError" class="error">{{ deviceError }}</p>
      </div>

      <!-- 故障描述 -->
      <div class="form-item">
        <label class="form-label">
          <span class="req">*</span>故障描述
        </label>
        <textarea
          v-model="desc"
          class="desc-input"
          placeholder="请输入故障情况,5-500 字"
          rows="5"
          maxlength="500"
        ></textarea>
        <div class="desc-foot">
          <p v-if="descError" class="error">{{ descError }}</p>
          <span v-else class="desc-count">{{ descCount }} / 500</span>
          <span v-if="descError" class="desc-count">{{ descCount }} / 500</span>
        </div>
      </div>

      <!-- 优先级 -->
      <div class="form-item">
        <label class="form-label">
          <span class="req">*</span>优先级
        </label>
        <div class="priority-cards">
          <button
            v-for="p in priorityOptions"
            :key="p.key"
            type="button"
            class="priority-card"
            :class="{
              active: priority === p.key,
              [`pcard-${p.color}`]: true,
            }"
            @click="priority = p.key"
          >
            <span class="pcard-dot" :class="`dot-${p.color}`"></span>
            <span class="pcard-label">{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="form-actions">
        <button class="btn" @click="cancel">取消</button>
        <button class="btn primary" @click="submit">提交工单</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.order-create {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部返回栏 */
.head-row {
  background: #fff;
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}
.back-btn {
  border: 1px solid #d8e1ee;
  background: #fff;
  color: var(--text-main);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.back-btn:hover { border-color: var(--primary); color: var(--primary); }

/* 表单卡片 */
.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f8;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
}
.req { color: #e5454b; margin-right: 2px; }

/* 错误提示 */
.error {
  color: #e5454b;
  font-size: 12px;
  margin: 0;
}

/* 已选设备框 */
.selected-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--primary);
  background: #f0f6fd;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
}
.selected-text { color: var(--text-main); }
.clear-btn {
  border: none;
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
}
.clear-btn:hover { color: #e5454b; }

/* 设备搜索输入 + 下拉 */
.device-search { position: relative; }
.device-input {
  width: 100%;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.device-input:focus { border-color: var(--primary); }

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(16, 48, 95, 0.08);
  max-height: 320px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 4px 0;
}
.dropdown-item {
  padding: 10px 14px;
  cursor: pointer;
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 8px;
  font-size: 13px;
}
.dropdown-item:hover { background: #f0f6fd; }
.dropdown-id { color: var(--text-sub); font-family: ui-monospace, monospace; }
.dropdown-name { color: var(--text-main); }
.dropdown-shop { color: var(--text-sub); font-size: 12px; }

/* 描述 */
.desc-input {
  width: 100%;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}
.desc-input:focus { border-color: var(--primary); }
.desc-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.desc-count { font-size: 12px; color: var(--text-sub); }

/* 优先级卡片 */
.priority-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.priority-card {
  border: 1px solid #d8e1ee;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: border-color 0.2s, background 0.2s;
}
.priority-card:hover { border-color: var(--primary); }
.priority-card.active {
  border-color: var(--primary);
  background: #f0f6fd;
}
.pcard-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot-red    { background: #e5454b; }
.dot-orange { background: #f08c2e; }
.dot-green  { background: #2bbf6a; }
.pcard-label { font-weight: 500; }

/* 底部按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eef2f8;
}
.btn {
  border: 1px solid #d8e1ee;
  background: #fff;
  color: var(--text-main);
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, opacity 0.2s;
}
.btn:hover { border-color: var(--primary); color: var(--primary); }
.btn.primary {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.btn.primary:hover { opacity: 0.9; color: #fff; }

/* 手机端 */
@media (max-width: 720px) {
  .priority-cards { grid-template-columns: 1fr; }
}
</style>