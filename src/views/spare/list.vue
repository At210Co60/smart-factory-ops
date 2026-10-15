<script setup lang="ts">
import { computed, ref } from 'vue'
import { DEVICES } from '@/mock/data'
import { currentUser, nowStr } from '@/utils/format'
import {
  loadSpares,
  moveSpare,
  upsertSpare,
  nextSpareCode,
  spareStatus,
  spareSummary,
  SPARE_STATUS_META,
  DEFAULT_SAFETY_STOCK,
  type SparePart,
  type SpareStatus,
} from '@/mock/spares'

/**
 * 备件库存页
 *
 * 解决的是"工单派下去了,才发现没件可换"。
 * 备件按适配备件类型挂在设备下,所以设备详情页能反查这台设备要用的件够不够。
 * 库存状态(缺货/低库存)按数量与安全库存现算,不落库。
 */

const spares = ref<SparePart[]>(loadSpares())

// 适配备件类型下拉:直接取设备台账里去重出来的类型
const deviceTypes = Array.from(new Set(DEVICES.map((d) => d.type)))

/* ================= 汇总 ================= */
const summary = computed(() => spareSummary(spares.value))

/* ================= 筛选 ================= */
const keyword = ref('')
const typeFilter = ref('all')
const statusFilter = ref<'all' | SpareStatus>('all')

// 缺货排最前,其次低库存,方便一眼看到要补什么
const STATUS_ORDER: Record<SpareStatus, number> = { out: 0, low: 1, ok: 2 }

const filteredList = computed<SparePart[]>(() => {
  const k = keyword.value.trim().toLowerCase()
  return spares.value
    .filter((s) => {
      if (k) {
        const hit =
          s.name.toLowerCase().includes(k) ||
          s.code.toLowerCase().includes(k) ||
          s.spec.toLowerCase().includes(k) ||
          s.location.toLowerCase().includes(k)
        if (!hit) return false
      }
      if (typeFilter.value !== 'all' && s.deviceType !== typeFilter.value) return false
      if (statusFilter.value !== 'all' && spareStatus(s) !== statusFilter.value) return false
      return true
    })
    .sort((a, b) => STATUS_ORDER[spareStatus(a)] - STATUS_ORDER[spareStatus(b)])
})

function statusMeta(s: SparePart) {
  return SPARE_STATUS_META[spareStatus(s)]
}

/* ================= 入库 / 出库弹窗 ================= */
const moveShow = ref(false)
const movePart = ref<SparePart | null>(null)
const moveType = ref<'in' | 'out'>('in')
const moveQty = ref<number>(1)
const moveNote = ref('')
const moveError = ref('')

function openMove(s: SparePart, type: 'in' | 'out') {
  movePart.value = s
  moveType.value = type
  moveQty.value = 1
  moveNote.value = ''
  moveError.value = ''
  moveShow.value = true
}

function submitMove() {
  if (!movePart.value) return
  const qty = Number(moveQty.value)
  const res = moveSpare(spares.value, movePart.value.code, moveType.value, qty, moveNote.value)
  if (!res.ok) {
    moveError.value = res.msg
    return
  }
  spares.value = res.list
  moveShow.value = false
}

/* ================= 新增 / 编辑备件 ================= */
const formShow = ref(false)
const editing = ref(false)
const formError = ref('')
const form = ref<SparePart>(blankForm())

function blankForm(): SparePart {
  return {
    code: '',
    name: '',
    spec: '',
    deviceType: deviceTypes[0] || '',
    qty: 0,
    safetyStock: DEFAULT_SAFETY_STOCK,
    unit: '个',
    location: '',
    movements: [],
  }
}

function openCreate() {
  editing.value = false
  formError.value = ''
  form.value = blankForm()
  formShow.value = true
}

function openEdit(s: SparePart) {
  editing.value = true
  formError.value = ''
  form.value = { ...s, movements: [...s.movements] }
  formShow.value = true
}

function submitForm() {
  const f = form.value
  if (!f.name.trim()) { formError.value = '请填写备件名称'; return }
  if (!f.deviceType) { formError.value = '请选择适配设备类型'; return }

  // 数量归一化后再落库:原生 number 输入留空时 v-model.number 会得到 '' ,
  // 直接存会存成字符串 —— 表格里显示空数量、库存状态还会被误判成缺货。
  // Math.trunc 顺带把 1.5 这类小数收成整数,负数在下一步挡掉。
  const qty = Math.trunc(Number(f.qty) || 0)
  const safetyStock = Math.trunc(Number(f.safetyStock) || 0)
  if (qty < 0) { formError.value = '期初库存不能为负数'; return }
  if (safetyStock < 0) { formError.value = '安全库存不能为负数'; return }

  const item: SparePart = editing.value
    ? { ...f, qty, safetyStock, name: f.name.trim(), spec: f.spec.trim(), location: f.location.trim() }
    : {
        ...f,
        code: nextSpareCode(spares.value),
        qty,
        safetyStock,
        name: f.name.trim(),
        spec: f.spec.trim(),
        location: f.location.trim(),
        // 新增时的期初数量记一条入库流水,账实相符。
        // 时间和经办人要写全:留空的话流水弹窗里这条只显示「—」,等于没留痕
        movements: qty > 0
          ? [{ type: 'in' as const, qty, time: nowStr(), operator: currentUser(), note: '新建备件期初入库' }]
          : [],
      }
  // 编辑时不允许直接改库存(库存只能走入库/出库),这里把数量还原成原值
  if (editing.value) {
    const origin = spares.value.find((s) => s.code === f.code)
    if (origin) item.qty = origin.qty
  }
  spares.value = upsertSpare(spares.value, item)
  formShow.value = false
}

/* ================= 流水弹窗 ================= */
const logShow = ref(false)
const logPart = ref<SparePart | null>(null)

function openLog(s: SparePart) {
  logPart.value = s
  logShow.value = true
}
</script>

<template>
  <section class="spare-page">
    <!-- 顶部 -->
    <div class="head-row">
      <div class="head-left">
        <h2 class="page-title">备件库存</h2>
        <span class="sub-title">别让维修卡在"没件可换"</span>
      </div>
      <button class="btn primary" @click="openCreate">新增备件</button>
    </div>

    <!-- 汇总卡 -->
    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-label">备件种类</span>
        <span class="summary-value">{{ summary.total }}<em>种</em></span>
      </div>
      <div class="summary-card border-red">
        <span class="summary-label">缺货</span>
        <span class="summary-value danger">{{ summary.out }}<em>种</em></span>
      </div>
      <div class="summary-card border-orange">
        <span class="summary-label">低于安全库存</span>
        <span class="summary-value warn">{{ summary.low }}<em>种</em></span>
      </div>
      <div class="summary-card border-green">
        <span class="summary-label">库存正常</span>
        <span class="summary-value good">{{ summary.ok }}<em>种</em></span>
      </div>
    </div>

    <!-- 低库存提醒:有缺货或低库存时才出现 -->
    <div v-if="summary.out || summary.low" class="alert-bar">
      <span class="alert-tag">补货提醒</span>
      <span class="alert-text">
        <template v-if="summary.out">{{ summary.out }} 种备件已缺货</template>
        <template v-if="summary.out && summary.low">，</template>
        <template v-if="summary.low">{{ summary.low }} 种低于安全库存</template>
        ，建议尽快采购入库
      </span>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <input
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="搜索备件名称 / 编号 / 规格 / 库位"
      />
      <select v-model="typeFilter" class="filter-select">
        <option value="all">全部设备类型</option>
        <option v-for="t in deviceTypes" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="statusFilter" class="filter-select">
        <option value="all">全部库存状态</option>
        <option value="out">缺货</option>
        <option value="low">低库存</option>
        <option value="ok">正常</option>
      </select>
      <button class="btn" @click="keyword = ''; typeFilter = 'all'; statusFilter = 'all'">重置</button>
    </div>

    <!-- 备件表格 -->
    <div class="table-card">
      <table v-if="filteredList.length" class="data-table">
        <thead>
          <tr>
            <th>备件编号</th>
            <th>备件名称</th>
            <th>规格型号</th>
            <th>适配设备</th>
            <th>库存</th>
            <th>安全库存</th>
            <th>库位</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filteredList" :key="s.code">
            <td class="mono">{{ s.code }}</td>
            <td>
              <button class="link-btn name-btn" @click="openLog(s)">{{ s.name }}</button>
            </td>
            <td class="spec-cell">{{ s.spec }}</td>
            <td>{{ s.deviceType }}</td>
            <td>
              <span class="qty" :class="{ 'qty-low': spareStatus(s) !== 'ok' }">{{ s.qty }}</span>
              <span class="qty-unit">{{ s.unit }}</span>
            </td>
            <td class="muted">{{ s.safetyStock }} {{ s.unit }}</td>
            <td class="mono muted">{{ s.location || '—' }}</td>
            <td>
              <span class="tag" :class="`tag-${statusMeta(s).color}`">{{ statusMeta(s).label }}</span>
            </td>
            <td>
              <div class="ops">
                <button class="link-btn" @click="openMove(s, 'in')">入库</button>
                <button class="link-btn" @click="openMove(s, 'out')">出库</button>
                <button class="link-btn" @click="openLog(s)">流水</button>
                <button class="link-btn" @click="openEdit(s)">编辑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty">
        <p>没有符合条件的备件</p>
      </div>
    </div>

    <!-- 入库 / 出库弹窗 -->
    <div v-if="moveShow && movePart" class="modal-mask" @click.self="moveShow = false">
      <div class="modal">
        <h3 class="modal-title">{{ moveType === 'in' ? '备件入库' : '备件出库' }}</h3>
        <p class="modal-desc">
          {{ movePart.code }} · {{ movePart.name }}（当前库存 {{ movePart.qty }} {{ movePart.unit }}）
        </p>

        <div class="form-item">
          <label class="form-label"><span class="req">*</span>数量（{{ movePart.unit }}）</label>
          <input v-model.number="moveQty" type="number" min="1" step="1" class="form-input" />
        </div>
        <div class="form-item">
          <label class="form-label">备注</label>
          <input
            v-model="moveNote"
            type="text"
            class="form-input"
            :placeholder="moveType === 'in' ? '例如:采购入库、退货入库' : '例如:用于 WO-261013001 维修'"
          />
        </div>

        <p v-if="moveError" class="form-error">{{ moveError }}</p>

        <div class="modal-actions">
          <button class="btn" @click="moveShow = false">取消</button>
          <button class="btn primary" @click="submitMove">确认{{ moveType === 'in' ? '入库' : '出库' }}</button>
        </div>
      </div>
    </div>

    <!-- 新增 / 编辑备件弹窗 -->
    <div v-if="formShow" class="modal-mask" @click.self="formShow = false">
      <div class="modal modal-form">
        <h3 class="modal-title">{{ editing ? '编辑备件' : '新增备件' }}</h3>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label"><span class="req">*</span>备件名称</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="例如:主轴电机" />
          </div>
          <div class="form-item">
            <label class="form-label">规格型号</label>
            <input v-model="form.spec" type="text" class="form-input" placeholder="例如:YZ-2200 3kW" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label"><span class="req">*</span>适配设备类型</label>
            <select v-model="form.deviceType" class="form-input">
              <option v-for="t in deviceTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">库位</label>
            <input v-model="form.location" type="text" class="form-input" placeholder="例如:A区-01-03" />
          </div>
        </div>

        <div class="form-row form-row-3">
          <div class="form-item">
            <label class="form-label">单位</label>
            <input v-model="form.unit" type="text" class="form-input" placeholder="个 / 套 / 台" />
          </div>
          <div class="form-item">
            <label class="form-label">安全库存</label>
            <input v-model.number="form.safetyStock" type="number" min="0" step="1" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">{{ editing ? '当前库存（走入库出库）' : '期初库存' }}</label>
            <input
              v-model.number="form.qty"
              type="number"
              min="0"
              step="1"
              class="form-input"
              :disabled="editing"
            />
          </div>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="modal-actions">
          <button class="btn" @click="formShow = false">取消</button>
          <button class="btn primary" @click="submitForm">{{ editing ? '保存修改' : '创建备件' }}</button>
        </div>
      </div>
    </div>

    <!-- 出入库流水弹窗 -->
    <div v-if="logShow && logPart" class="modal-mask" @click.self="logShow = false">
      <div class="modal modal-form">
        <h3 class="modal-title">出入库流水 · {{ logPart.name }}</h3>
        <p class="modal-desc">
          {{ logPart.code }} · 当前库存 {{ logPart.qty }} {{ logPart.unit }} · 安全库存
          {{ logPart.safetyStock }} {{ logPart.unit }}
        </p>

        <ul v-if="logPart.movements.length" class="log-list">
          <li v-for="(m, i) in logPart.movements" :key="i" class="log-item">
            <span class="log-badge" :class="m.type === 'in' ? 'log-in' : 'log-out'">
              {{ m.type === 'in' ? '入' : '出' }}
            </span>
            <div class="log-body">
              <div class="log-line">
                <span class="log-qty">{{ m.type === 'in' ? '+' : '-' }}{{ m.qty }} {{ logPart.unit }}</span>
                <span class="log-time">{{ m.time || '—' }}</span>
              </div>
              <p class="log-note">{{ m.note }}</p>
              <p v-if="m.operator" class="log-op">经办人：{{ m.operator }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="empty-log">暂无出入库记录</p>

        <div class="modal-actions">
          <button class="btn primary" @click="logShow = false">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.spare-page {
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
.summary-value.good { color: #2bbf6a; }
.border-red { border-left-color: #e5454b; }
.border-orange { border-left-color: #f08c2e; }
.border-green { border-left-color: #2bbf6a; }

/* 低库存提醒条:琥珀色,是提醒不是报错 */
.alert-bar {
  background: #fff8ec;
  border: 1px solid #f5d9ab;
  border-left: 4px solid #f08c2e;
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.alert-tag {
  flex-shrink: 0;
  background: #f08c2e;
  color: #fff;
  border-radius: 10px;
  padding: 2px 10px;
  font-size: 12px;
}
.alert-text { color: #8a5b1a; }

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
  vertical-align: middle;
}
.data-table th { background: #f8fafd; color: var(--text-sub); font-weight: 500; }
.data-table tbody tr:hover { background: #fafcff; }
.mono { font-family: ui-monospace, monospace; }
.muted { color: var(--text-sub); font-size: 13px; }
.spec-cell { max-width: 180px; color: var(--text-sub); font-size: 13px; }
.qty { font-size: 16px; font-weight: 600; color: var(--text-main); }
.qty-low { color: #e5454b; }
.qty-unit { font-size: 12px; color: var(--text-sub); margin-left: 3px; }
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
.name-btn { font-weight: 500; }

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
.modal-form { width: 560px; }
.modal-title { font-size: 16px; font-weight: 600; margin: 0; }
.modal-desc { font-size: 14px; color: var(--text-sub); margin: 0; line-height: 1.6; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* 表单 */
.form-item { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
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
.form-input:disabled { background: #f5f8fd; color: var(--text-sub); cursor: not-allowed; }
.form-error { color: #e5454b; font-size: 12px; margin: 0; }

/* 流水列表 */
.log-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.log-item { display: flex; gap: 10px; align-items: flex-start; }
.log-badge {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}
.log-in { background: #2bbf6a; }
.log-out { background: #f08c2e; }
.log-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.log-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.log-qty { font-size: 14px; font-weight: 600; color: var(--text-main); }
.log-time { font-size: 12px; color: var(--text-sub); }
.log-note { font-size: 13px; color: var(--text-sub); margin: 0; line-height: 1.6; }
.log-op { font-size: 12px; color: var(--text-sub); margin: 0; }
.empty-log { font-size: 13px; color: var(--text-sub); margin: 0; }

/* 手机端 */
@media (max-width: 720px) {
  .table-card { overflow-x: auto; }
  .data-table { min-width: 980px; }
  .form-row,
  .form-row-3 { grid-template-columns: 1fr; }
}
</style>
