<script setup lang="ts">
import { computed, ref } from 'vue'
import { DEVICES } from '@/mock/data'
import {
  loadPlans,
  planStatus,
  daysUntil,
  planSummary,
  completePlan,
  upsertPlan,
  removePlan,
  togglePlan,
  nextPlanId,
  PLAN_TYPES,
  PLAN_STATUS_META,
  CYCLE_PRESETS,
  type MaintenancePlan,
  type PlanType,
  type PlanStatus,
} from '@/mock/plans'
import { todayStr, dateAfterDays } from '@/utils/format'

/**
 * 维护计划页
 *
 * 设备台账只告诉你"设备现在是什么状态",这一页回答"接下来该保养谁、什么时候"。
 * 状态不落库,全部按下次维护日期现算,所以不需要有人每天去改数据。
 */

const plans = ref<MaintenancePlan[]>(loadPlans())

/* ================= 顶部汇总 ================= */
const summary = computed(() => planSummary(plans.value))

/* ================= 筛选 ================= */
const keyword = ref('')
const statusFilter = ref<'all' | PlanStatus>('all')
const typeFilter = ref<'all' | PlanType>('all')

// 状态排序:逾期 → 即将到期 → 正常 → 已停用,把要处理的顶到前面
const STATUS_ORDER: Record<PlanStatus, number> = { overdue: 0, soon: 1, ok: 2, paused: 3 }

const filteredList = computed<MaintenancePlan[]>(() => {
  const k = keyword.value.trim().toLowerCase()
  return plans.value
    .filter((p) => {
      // 关键字:设备名称 / 设备编号 / 维护内容 / 负责人
      if (k) {
        const hit =
          p.deviceName.toLowerCase().includes(k) ||
          p.deviceId.toLowerCase().includes(k) ||
          p.content.toLowerCase().includes(k) ||
          p.owner.toLowerCase().includes(k)
        if (!hit) return false
      }
      if (typeFilter.value !== 'all' && p.type !== typeFilter.value) return false
      if (statusFilter.value !== 'all' && planStatus(p) !== statusFilter.value) return false
      return true
    })
    .sort((a, b) => STATUS_ORDER[planStatus(a)] - STATUS_ORDER[planStatus(b)] || (a.nextDate < b.nextDate ? -1 : 1))
})

/* ================= 状态展示辅助 ================= */
function statusMeta(p: MaintenancePlan) {
  return PLAN_STATUS_META[planStatus(p)]
}
// 距下次维护的天数文案:逾期显示"已逾期 N 天",其余显示"还有 N 天/今天"
function countdownText(p: MaintenancePlan): string {
  if (p.paused) return '—'
  const d = daysUntil(p.nextDate)
  if (d < 0) return `已逾期 ${-d} 天`
  if (d === 0) return '今天到期'
  return `还有 ${d} 天`
}

/* ================= 完成本次维护(带确认) ================= */
interface ConfirmState {
  show: boolean
  title: string
  desc: string
  onConfirm: () => void
}
const confirmState = ref<ConfirmState>({ show: false, title: '', desc: '', onConfirm: () => {} })
function openConfirm(title: string, desc: string, onConfirm: () => void) {
  confirmState.value = { show: true, title, desc, onConfirm }
}
function cancelConfirm() { confirmState.value.show = false }
function doConfirm() {
  const cb = confirmState.value.onConfirm
  confirmState.value.show = false
  cb()
}

function handleComplete(p: MaintenancePlan) {
  openConfirm(
    '完成本次维护',
    `确认 ${p.deviceName} 的「${p.content}」已完成?完成后下次日期按 ${p.cycleDays} 天顺延。`,
    () => { plans.value = completePlan(plans.value, p.id) },
  )
}

function handleToggle(p: MaintenancePlan) {
  plans.value = togglePlan(plans.value, p.id)
}

function handleDelete(p: MaintenancePlan) {
  openConfirm('删除计划', `确认删除 ${p.deviceName} 的这条维护计划?删除后不可恢复。`, () => {
    plans.value = removePlan(plans.value, p.id)
  })
}

/* ================= 新增 / 编辑弹窗 ================= */
const formShow = ref(false)
const editing = ref(false)   // true = 编辑,false = 新增
const formError = ref('')
const form = ref<MaintenancePlan>(blankForm())

function blankForm(): MaintenancePlan {
  return {
    id: '',
    deviceId: '',
    deviceName: '',
    type: '例行保养',
    content: '',
    cycleDays: 30,
    nextDate: dateAfterDays(7),
    lastDate: '',
    owner: '',
    paused: false,
    createdAt: '',
  }
}

function openCreate() {
  editing.value = false
  formError.value = ''
  form.value = blankForm()
  formShow.value = true
}

function openEdit(p: MaintenancePlan) {
  editing.value = true
  formError.value = ''
  form.value = { ...p }
  formShow.value = true
}

function closeForm() { formShow.value = false }

// 选设备时把名称和负责人一起带出来,少填两个框
function onDeviceChange() {
  const d = DEVICES.find((x) => x.id === form.value.deviceId)
  if (d) {
    form.value.deviceName = d.name
    if (!form.value.owner) form.value.owner = d.owner
  }
}

function submitForm() {
  const f = form.value
  if (!f.deviceId) { formError.value = '请选择设备'; return }
  if (!f.content.trim()) { formError.value = '请填写维护内容'; return }
  if (!f.nextDate) { formError.value = '请选择下次维护日期'; return }

  const item: MaintenancePlan = editing.value
    ? { ...f, content: f.content.trim() }
    : {
        ...f,
        id: nextPlanId(plans.value),
        content: f.content.trim(),
        createdAt: todayStr(),
      }
  plans.value = upsertPlan(plans.value, item)
  formShow.value = false
}

// 编辑时如果改了周期,不动历史日期,只让用户自己改下次日期
function applyCyclePreset(days: number) {
  form.value.cycleDays = days
  if (!editing.value) form.value.nextDate = dateAfterDays(days)
}
</script>

<template>
  <section class="plan-page">
    <!-- 顶部标题 + 新建 -->
    <div class="head-row">
      <div class="head-left">
        <h2 class="page-title">维护计划</h2>
        <span class="sub-title">把"坏了才修"变成"到点就保养"</span>
      </div>
      <button class="btn primary" @click="openCreate">新建计划</button>
    </div>

    <!-- 汇总小卡 -->
    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-label">计划总数</span>
        <span class="summary-value">{{ summary.total }}<em>条</em></span>
      </div>
      <div class="summary-card border-red">
        <span class="summary-label">已逾期</span>
        <span class="summary-value danger">{{ summary.overdue }}<em>条</em></span>
      </div>
      <div class="summary-card border-orange">
        <span class="summary-label">7 天内到期</span>
        <span class="summary-value warn">{{ summary.soon }}<em>条</em></span>
      </div>
      <div class="summary-card border-gray">
        <span class="summary-label">已停用</span>
        <span class="summary-value">{{ summary.paused }}<em>条</em></span>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <input
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="搜索设备名称 / 编号 / 维护内容 / 负责人"
      />
      <select v-model="statusFilter" class="filter-select">
        <option value="all">全部状态</option>
        <option value="overdue">已逾期</option>
        <option value="soon">即将到期</option>
        <option value="ok">正常</option>
        <option value="paused">已停用</option>
      </select>
      <select v-model="typeFilter" class="filter-select">
        <option value="all">全部类型</option>
        <option v-for="t in PLAN_TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
      <button class="btn" @click="keyword = ''; statusFilter = 'all'; typeFilter = 'all'">重置</button>
    </div>

    <!-- 计划表格 -->
    <div class="table-card">
      <table v-if="filteredList.length" class="data-table">
        <thead>
          <tr>
            <th>计划编号</th>
            <th>设备</th>
            <th>类型</th>
            <th>维护内容</th>
            <th>周期</th>
            <th>下次维护</th>
            <th>状态</th>
            <th>负责人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredList" :key="p.id" :class="{ 'row-paused': p.paused }">
            <td class="mono">{{ p.id }}</td>
            <td>
              <div class="device-cell">
                <span class="device-name">{{ p.deviceName }}</span>
                <span class="device-id mono">{{ p.deviceId }}</span>
              </div>
            </td>
            <td>{{ p.type }}</td>
            <td class="content-cell">{{ p.content }}</td>
            <td>{{ p.cycleDays }} 天</td>
            <td>
              <div class="date-cell">
                <span>{{ p.nextDate }}</span>
                <span class="countdown" :class="`cd-${PLAN_STATUS_META[planStatus(p)].color}`">
                  {{ countdownText(p) }}
                </span>
              </div>
            </td>
            <td>
              <span class="tag" :class="`tag-${statusMeta(p).color}`">{{ statusMeta(p).label }}</span>
            </td>
            <td>{{ p.owner || '—' }}</td>
            <td>
              <div class="ops">
                <button v-if="!p.paused" class="link-btn" @click="handleComplete(p)">完成本次</button>
                <button class="link-btn" @click="openEdit(p)">编辑</button>
                <button class="link-btn" @click="handleToggle(p)">{{ p.paused ? '启用' : '停用' }}</button>
                <button class="link-btn danger" @click="handleDelete(p)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty">
        <p>没有符合条件的维护计划</p>
      </div>
    </div>

    <!-- 确认弹框 -->
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

    <!-- 新增 / 编辑弹窗 -->
    <div v-if="formShow" class="modal-mask" @click.self="closeForm">
      <div class="modal modal-form">
        <h3 class="modal-title">{{ editing ? '编辑维护计划' : '新建维护计划' }}</h3>

        <div class="form-item">
          <label class="form-label"><span class="req">*</span>设备</label>
          <select v-model="form.deviceId" class="form-input" @change="onDeviceChange">
            <option value="">请选择设备</option>
            <option v-for="d in DEVICES" :key="d.id" :value="d.id">
              {{ d.id }} · {{ d.name }} · {{ d.shop }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label">维护类型</label>
            <select v-model="form.type" class="form-input">
              <option v-for="t in PLAN_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label"><span class="req">*</span>下次维护日期</label>
            <input v-model="form.nextDate" type="date" class="form-input" />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label"><span class="req">*</span>维护内容</label>
          <input
            v-model="form.content"
            type="text"
            class="form-input"
            placeholder="例如:更换润滑油、检查主轴精度"
            maxlength="60"
          />
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label">维护周期</label>
            <div class="cycle-group">
              <button
                v-for="c in CYCLE_PRESETS"
                :key="c"
                type="button"
                class="cycle-chip"
                :class="{ active: form.cycleDays === c }"
                @click="applyCyclePreset(c)"
              >
                {{ c }} 天
              </button>
            </div>
          </div>
          <div class="form-item owner-item">
            <label class="form-label">负责人</label>
            <input v-model="form.owner" type="text" class="form-input" placeholder="默认取设备负责人" />
          </div>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="modal-actions">
          <button class="btn" @click="closeForm">取消</button>
          <button class="btn primary" @click="submitForm">{{ editing ? '保存修改' : '创建计划' }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.plan-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部 */
.head-row {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}
.head-left { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.page-title { font-size: 18px; font-weight: 600; margin: 0; }
.sub-title { font-size: 13px; color: var(--text-sub); }

/* 汇总卡 */
.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 18px;
  border-left: 4px solid #d8e1ee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
  min-width: 0;
}
.summary-label { font-size: 13px; color: var(--text-sub); }
.summary-value { font-size: 22px; font-weight: 600; color: var(--text-main); }
.summary-value em { font-style: normal; font-size: 12px; font-weight: 500; color: var(--text-sub); margin-left: 2px; }
.summary-value.danger { color: #e5454b; }
.summary-value.warn { color: #f08c2e; }
.border-red { border-left-color: #e5454b; }
.border-orange { border-left-color: #f08c2e; }
.border-gray { border-left-color: #8a93a6; }

/* 工具栏 */
.toolbar {
  background: #fff;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}
.search-input {
  flex: 1;
  min-width: 200px;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--primary); }
.filter-select {
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-main);
  background: #fff;
  cursor: pointer;
  outline: none;
}
.filter-select:focus { border-color: var(--primary); }

/* 表格 */
.table-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eef2f8;
  vertical-align: top;
}
.data-table th { background: #f8fafd; color: var(--text-sub); font-weight: 500; }
.data-table tbody tr:hover { background: #fafcff; }
.row-paused { opacity: 0.55; }
.mono { font-family: ui-monospace, monospace; }
.device-cell { display: flex; flex-direction: column; gap: 2px; }
.device-name { color: var(--text-main); }
.device-id { font-size: 12px; color: var(--text-sub); }
.content-cell { max-width: 240px; }
.date-cell { display: flex; flex-direction: column; gap: 2px; }
.countdown { font-size: 12px; }
.cd-red { color: #e5454b; }
.cd-orange { color: #f08c2e; }
.cd-green { color: #2bbf6a; }
.cd-gray { color: var(--text-sub); }
.empty { padding: 60px 24px; text-align: center; color: var(--text-sub); font-size: 14px; }

/* 标签 */
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
}
.tag-green { background: #2bbf6a; }
.tag-red { background: #e5454b; }
.tag-gray { background: #8a93a6; }
.tag-orange { background: #f08c2e; }

/* 行内操作 */
.ops { display: flex; gap: 12px; flex-wrap: wrap; }
.link-btn {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  white-space: nowrap;
}
.link-btn:hover { text-decoration: underline; }
.link-btn.danger { color: #e5454b; }

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
.btn.primary { border-color: var(--primary); background: var(--primary); color: #fff; }
.btn.primary:hover { opacity: 0.9; color: #fff; }

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(16, 48, 95, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal {
  background: #fff;
  border-radius: 12px;
  width: 420px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-form { width: 520px; }
.modal-title { font-size: 16px; font-weight: 600; margin: 0; }
.modal-desc { font-size: 14px; color: var(--text-sub); margin: 0; line-height: 1.6; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* 表单 */
.form-item { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.owner-item { max-width: 100%; }
.form-label { font-size: 13px; color: var(--text-main); font-weight: 500; }
.req { color: #e5454b; margin-right: 2px; }
.form-input {
  width: 100%;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--text-main);
  background: #fff;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--primary); }
.cycle-group { display: flex; flex-wrap: wrap; gap: 6px; }
.cycle-chip {
  border: 1px solid #d8e1ee;
  background: #fff;
  color: var(--text-sub);
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.cycle-chip:hover { border-color: var(--primary); color: var(--primary); }
.cycle-chip.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.form-error { color: #e5454b; font-size: 12px; margin: 0; }

/* 手机端 */
@media (max-width: 720px) {
  .table-card { overflow-x: auto; }
  .data-table { min-width: 900px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
