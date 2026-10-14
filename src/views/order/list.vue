<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  loadOrders,
  saveOrders,
  PRIORITY,
  type WorkOrder,
} from '@/mock/data'

const router = useRouter()

/* ============= 数据初始化 ============= */
const orderList = ref<WorkOrder[]>([])

onMounted(() => {
  orderList.value = loadOrders()
})

/* ============= 三个页签 + 角标 ============= */
type TabKey = 'pending' | 'processing' | 'done'
const activeTab = ref<TabKey>('pending')

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'pending',    label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'done',       label: '已完成' },
]

// 角标数:每个状态的工单数量
const counts = computed(() => ({
  pending:    orderList.value.filter((o) => o.status === 'pending').length,
  processing: orderList.value.filter((o) => o.status === 'processing').length,
  done:       orderList.value.filter((o) => o.status === 'done').length,
}))

// 切页签 + 回第 1 页
function switchTab(key: TabKey) {
  activeTab.value = key
  pageNo.value = 1
}

/* ============= 表格筛选 + 分页 ============= */
// 当前页签的工单
const currentList = computed<WorkOrder[]>(() =>
  orderList.value.filter((o) => o.status === activeTab.value),
)

const pageNo = ref(1)
const pageSize = ref<5 | 10 | 20>(10)
const total = computed(() => currentList.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
import { watch } from 'vue'
watch([pageSize, activeTab], () => { pageNo.value = 1 })
watch(totalPages, () => { if (pageNo.value > totalPages.value) pageNo.value = totalPages.value })

const pagedList = computed<WorkOrder[]>(() => {
  const start = (pageNo.value - 1) * pageSize.value
  return currentList.value.slice(start, start + pageSize.value)
})

function prevPage() { if (pageNo.value > 1) pageNo.value-- }
function nextPage() { if (pageNo.value < totalPages.value) pageNo.value++ }

/* ============= 表头文字(时间列随页签变)============ */
// 已完成 = "完成时间",其他 = "创建时间"
const timeHeader = computed(() => (activeTab.value === 'done' ? '完成时间' : '创建时间'))

/* ============= 状态流转 ============= */
function nowStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function persist() {
  saveOrders(orderList.value)
}

/* ============= 确认弹框 ============= */
interface ConfirmState {
  show: boolean
  title: string
  desc: string
  onConfirm: () => void
}
const confirmState = ref<ConfirmState>({
  show: false,
  title: '',
  desc: '',
  onConfirm: () => {},
})

function openConfirm(title: string, desc: string, onConfirm: () => void) {
  confirmState.value = { show: true, title, desc, onConfirm }
}
function cancelConfirm() { confirmState.value.show = false }
function doConfirm() {
  const cb = confirmState.value.onConfirm
  confirmState.value.show = false
  cb()
}

// 「开始处理」:pending → processing
function startProcess(o: WorkOrder) {
  openConfirm('开始处理工单', `确认将工单 ${o.no} 设为处理中状态?`, () => {
    o.status = 'processing'
    persist()
  })
}

// 「完成」:processing → done,写入完成时间
function completeOrder(o: WorkOrder) {
  openConfirm('完成工单', `确认将工单 ${o.no} 标记为已完成?`, () => {
    o.status = 'done'
    o.finishTime = nowStr()
    persist()
  })
}

// 「查看设备」:已完成页 → 跳设备详情
function viewDevice(o: WorkOrder) {
  router.push(`/device/detail/${o.deviceId}`)
}

/* ============= 跳创建工单 ============= */
function goCreate() { router.push('/order/create') }

/* ============= 标签颜色辅助 ============= */
function priorityColor(p: WorkOrder['priority']) { return PRIORITY[p]?.color    || 'gray' }
function priorityLabel(p: WorkOrder['priority']) { return PRIORITY[p]?.label    || '—' }

// 各页签空状态提示
const emptyText = computed(() => {
  if (activeTab.value === 'pending')    return '暂无待处理工单'
  if (activeTab.value === 'processing') return '暂无处理中工单'
  return '暂无已完成工单'
})
</script>

<template>
  <section class="order-list">
    <!-- 顶部:页签 + 创建按钮 -->
    <div class="toolbar">
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab"
          :class="{ active: activeTab === t.key }"
          @click="switchTab(t.key)"
        >
          <span>{{ t.label }}</span>
          <span class="badge">{{ counts[t.key] }}</span>
        </button>
      </div>
      <button class="btn primary" @click="goCreate">创建工单</button>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <table v-if="pagedList.length" class="data-table">
        <thead>
          <tr>
            <th>工单编号</th>
            <th>设备名称</th>
            <th>故障描述</th>
            <th>优先级</th>
            <th>{{ timeHeader }}</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in pagedList" :key="o.no">
            <td>{{ o.no }}</td>
            <td>{{ o.deviceName }}</td>
            <td class="ellipsis-cell">{{ o.desc }}</td>
            <td>
              <span class="tag" :class="`tag-${priorityColor(o.priority)}`">
                {{ priorityLabel(o.priority) }}
              </span>
            </td>
            <td>{{ activeTab === 'done' ? o.finishTime : o.createTime }}</td>
            <td>
              <button
                v-if="o.status === 'pending'"
                class="link-btn"
                @click="startProcess(o)"
              >
                开始处理
              </button>
              <button
                v-else-if="o.status === 'processing'"
                class="link-btn"
                @click="completeOrder(o)"
              >
                完成
              </button>
              <button
                v-else
                class="link-btn"
                @click="viewDevice(o)"
              >
                查看设备
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div v-else class="empty">
        <p>{{ emptyText }}</p>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination">
      <div class="page-size">
        每页
        <select v-model.number="pageSize" class="page-size-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
        </select>
        条
      </div>
      <div class="pager">
        <button class="btn small" :disabled="pageNo <= 1" @click="prevPage">上一页</button>
        <span class="page-no">第 {{ pageNo }} / {{ totalPages }} 页</span>
        <button class="btn small" :disabled="pageNo >= totalPages" @click="nextPage">下一页</button>
      </div>
      <div class="total">共 {{ total }} 条</div>
    </div>

    <!-- 半透明遮罩确认框 -->
    <div v-if="confirmState.show" class="modal-mask" @click.self="cancelConfirm">
      <div class="modal">
        <h3 class="modal-title">{{ confirmState.title }}</h3>
        <p class="modal-desc">{{ confirmState.desc }}</p>
        <div class="modal-actions">
          <button class="btn" @click="cancelConfirm">取消</button>
          <button class="btn primary" @click="doConfirm">确定</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部工具栏 */
.toolbar {
  background: #fff;
  border-radius: 12px;
  padding: 8px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}

.tabs {
  display: flex;
  gap: 4px;
}
.tab {
  border: none;
  background: transparent;
  padding: 12px 18px;
  font-size: 14px;
  color: var(--text-sub);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s, color 0.2s;
}
.tab:hover { background: #f0f4fa; color: var(--text-main); }
.tab.active {
  color: var(--primary);
  background: #e8f0fb;
  font-weight: 500;
}
.badge {
  display: inline-block;
  min-width: 22px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 9px;
  background: #f0f4fa;
  color: var(--text-sub);
  font-size: 12px;
  text-align: center;
}
.tab.active .badge {
  background: var(--primary);
  color: #fff;
}

/* 按钮 */
.btn {
  border: 1px solid #d8e1ee;
  background: #fff;
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, opacity 0.2s;
}
.btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.btn.primary {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.btn.primary:hover { opacity: 0.9; color: #fff; }
.btn.small { padding: 5px 12px; font-size: 12px; }
.btn:disabled { cursor: not-allowed; opacity: 0.5; }

/* 表格卡片 */
.table-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eef2f8;
}
.data-table th {
  background: #f8fafd;
  color: var(--text-sub);
  font-weight: 500;
}
.data-table tbody tr:hover { background: #fafcff; }

.ellipsis-cell {
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}
.link-btn:hover { text-decoration: underline; }

/* 状态/优先级标签 */
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
}
.tag-green  { background: #2bbf6a; }
.tag-red    { background: #e5454b; }
.tag-gray   { background: #8a93a6; }
.tag-orange { background: #f08c2e; }
.tag-blue   { background: #2e7be2; }

/* 空状态 */
.empty {
  padding: 60px 24px;
  text-align: center;
  color: var(--text-sub);
  font-size: 14px;
}

/* 分页 */
.pagination {
  background: #fff;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}
.page-size { font-size: 13px; color: var(--text-sub); }
.page-size-select {
  border: 1px solid #d8e1ee;
  border-radius: 6px;
  padding: 3px 6px;
  margin: 0 4px;
  font-size: 13px;
}
.pager { display: flex; align-items: center; gap: 8px; }
.page-no { font-size: 13px; color: var(--text-sub); margin: 0 6px; }
.total { font-size: 13px; color: var(--text-sub); }

/* 确认弹框 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(16, 48, 95, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 12px;
  width: 360px;
  max-width: 90vw;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.modal-desc {
  font-size: 14px;
  color: var(--text-sub);
  margin: 0;
  line-height: 1.6;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 手机端 */
@media (max-width: 720px) {
  .toolbar { flex-wrap: wrap; gap: 8px; padding: 12px; }
  .tabs { width: 100%; overflow-x: auto; }
  .table-card { overflow-x: auto; }
  .data-table { min-width: 720px; }
  .pagination { flex-wrap: wrap; gap: 8px; justify-content: center; }
}
</style>