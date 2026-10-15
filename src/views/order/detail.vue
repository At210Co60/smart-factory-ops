<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  loadOrders,
  transitionOrder,
  ORDER_STATUS,
  PRIORITY,
  type WorkOrder,
} from '@/mock/data'

const route = useRoute()
const router = useRouter()

// 路由参数里的工单号(/order/detail/:no)
const orderNo = computed(() => String(route.params.no || ''))

// 每次操作后重新 loadOrders,保证页面里的对象和 localStorage 一致
const orders = ref<WorkOrder[]>(loadOrders())

const order = computed<WorkOrder | undefined>(() =>
  orders.value.find((o) => o.no === orderNo.value),
)

/* ============= 操作日志:从旧到新 ============= */
const logs = computed(() => order.value?.opLog || [])

// 日志圆点 / 标签的配色:创建=灰 / 处理中=蓝 / 完成=绿
const LOG_COLORS: Record<string, string> = {
  pending: 'gray',
  processing: 'blue',
  done: 'green',
}

/* ============= 基础信息(卡里仍然是 ID,可点击跳设备详情) ============= */
function statusLabel(s: WorkOrder['status']) {
  return ORDER_STATUS[s]?.label || '—'
}
function statusColor(s: WorkOrder['status']) {
  return ORDER_STATUS[s]?.color || 'gray'
}
function priorityLabel(p: WorkOrder['priority']) {
  return PRIORITY[p]?.label || '—'
}
function priorityColor(p: WorkOrder['priority']) {
  return PRIORITY[p]?.color || 'gray'
}

/* ============= 流转(和工单列表同一套 data.ts 方法,日志同步写) ============= */
// 流转成功后停在本页,时间轴立刻多一条,演示时比跳回列表更有说服力
function startProcess() {
  if (!order.value) return
  openConfirm('开始处理工单', `确认将工单 ${order.value.no} 设为处理中状态?`, () => {
    orders.value = transitionOrder(orders.value, orderNo.value, 'processing')
  })
}

function completeOrder() {
  if (!order.value) return
  openConfirm('完成工单', `确认将工单 ${order.value.no} 标记为已完成?`, () => {
    orders.value = transitionOrder(orders.value, orderNo.value, 'done')
  })
}

/* ============= 确认弹框(与工单列表写法一致,项目不引外部组件库) ============= */
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

/* ============= 跳转 ============= */
function goBack() { router.push('/order/list') }
function goDevice() {
  if (!order.value) return
  router.push(`/device/detail/${order.value.deviceId}`)
}
</script>

<template>
  <section v-if="order" class="order-detail">
    <!-- 顶部返回栏 -->
    <div class="head-row">
      <div class="head-left">
        <button class="back-btn" @click="goBack">← 返回工单列表</button>
        <h2 class="order-no">{{ order.no }}</h2>
        <span class="tag" :class="`tag-${statusColor(order.status)}`">
          {{ statusLabel(order.status) }}
        </span>
        <span class="tag" :class="`tag-${priorityColor(order.priority)}`">
          {{ priorityLabel(order.priority) }}优先级
        </span>
      </div>
      <!-- 操作区:按当前状态给不同按钮 -->
      <div class="head-right">
        <button
          v-if="order.status === 'pending'"
          class="btn primary"
          @click="startProcess"
        >
          开始处理
        </button>
        <button
          v-else-if="order.status === 'processing'"
          class="btn primary"
          @click="completeOrder"
        >
          标记完成
        </button>
        <button class="btn" @click="goDevice">查看关联设备</button>
      </div>
    </div>

    <!-- 两列:左工单信息 + 右操作日志 -->
    <div class="cards">
      <!-- 左:工单信息 -->
      <div class="card">
        <h3 class="card-title">工单信息</h3>

        <!-- 故障描述整段展示,不再被表格省略号截断 -->
        <div class="desc-block">
          <span class="info-label">故障描述</span>
          <p class="desc-text">{{ order.desc }}</p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">关联设备</span>
            <span class="info-value link" @click="goDevice">
              {{ order.deviceName }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">设备编号</span>
            <span class="info-value mono">{{ order.deviceId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">优先级</span>
            <span class="info-value">
              <span class="tag small" :class="`tag-${priorityColor(order.priority)}`">
                {{ priorityLabel(order.priority) }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">当前状态</span>
            <span class="info-value">
              <span class="tag small" :class="`tag-${statusColor(order.status)}`">
                {{ statusLabel(order.status) }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ order.createTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">完成时间</span>
            <span class="info-value">{{ order.finishTime || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- 右:操作日志时间轴 -->
      <div class="card">
        <h3 class="card-title">操作日志</h3>
        <ul class="timeline">
          <li v-for="(log, i) in logs" :key="i" class="timeline-item">
            <div class="timeline-dot" :class="`dot-${LOG_COLORS[log.status] || 'gray'}`"></div>
            <div class="timeline-body">
              <div class="timeline-head">
                <span class="timeline-label">{{ log.label }}</span>
                <span class="timeline-time">{{ log.time }}</span>
              </div>
              <p class="timeline-note">{{ log.note }}</p>
              <p class="timeline-handler">操作人：{{ log.operator }}</p>
            </div>
          </li>
        </ul>
        <p v-if="!logs.length" class="empty-log">暂无操作记录</p>
      </div>
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

  <!-- 工单号无效时整页空状态 -->
  <section v-else class="empty-page">
    <div class="empty-card">
      <p class="empty-text">工单不存在或未选择工单</p>
      <button class="btn primary" @click="goBack">返回工单列表</button>
    </div>
  </section>
</template>

<style scoped>
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部栏:左边标题,右边操作按钮 */
.head-row {
  background: #fff;
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.head-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.head-right {
  display: flex;
  align-items: center;
  gap: 8px;
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
.order-no {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  font-family: ui-monospace, monospace;
}

/* 两列卡片 */
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
  display: flex;
  flex-direction: column;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f8;
}

/* 故障描述 */
.desc-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: #f8fafd;
  border-radius: 8px;
  margin-bottom: 16px;
}
.desc-text {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.7;
  margin: 0;
}

/* 基本信息两列 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-label {
  font-size: 12px;
  color: var(--text-sub);
}
.info-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}
.info-value.mono { font-family: ui-monospace, monospace; }
.info-value.link {
  color: var(--primary);
  cursor: pointer;
}
.info-value.link:hover { text-decoration: underline; }

/* 操作日志时间轴 */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0 0 0 6px;
  position: relative;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: #eef2f8;
}
.timeline-item {
  position: relative;
  padding: 0 0 16px 22px;
}
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot {
  position: absolute;
  left: 0;
  top: 5px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px #d8e1ee;
}
.dot-gray  { background: #8a93a6; }
.dot-blue  { background: #2e7be2; }
.dot-green { background: #2bbf6a; }
.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.timeline-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.timeline-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}
.timeline-time {
  font-size: 12px;
  color: var(--text-sub);
}
.timeline-note {
  font-size: 13px;
  color: var(--text-sub);
  margin: 0;
  line-height: 1.6;
}
.timeline-handler {
  font-size: 12px;
  color: var(--text-sub);
  margin: 0;
}
.empty-log {
  font-size: 13px;
  color: var(--text-sub);
  margin: 0;
}

/* 标签 */
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
}
.tag.small { padding: 1px 8px; font-size: 11px; }
.tag-green  { background: #2bbf6a; }
.tag-red    { background: #e5454b; }
.tag-gray   { background: #8a93a6; }
.tag-orange { background: #f08c2e; }
.tag-blue   { background: #2e7be2; }

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
.btn:hover { border-color: var(--primary); color: var(--primary); }
.btn.primary {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.btn.primary:hover { opacity: 0.9; color: #fff; }

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

/* 整页空状态 */
.empty-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-card {
  background: #fff;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}
.empty-text {
  color: var(--text-sub);
  font-size: 14px;
  margin: 0;
}

/* 手机端:单列堆叠 */
@media (max-width: 900px) {
  .cards { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
}
</style>
