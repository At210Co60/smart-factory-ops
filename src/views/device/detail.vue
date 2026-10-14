<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DEVICES, DEVICE_STATUS, type Device } from '@/mock/data'

const route = useRoute()
const router = useRouter()

// 路由参数里的设备编号(/device/detail/:id)
const deviceId = computed(() => String(route.params.id || ''))

// 从 DEVICES 里找到当前设备
const device = computed<Device | undefined>(() =>
  DEVICES.find((d) => d.id === deviceId.value),
)

function statusLabel(s: Device['status']) {
  return DEVICE_STATUS[s]?.label || '—'
}
function statusColor(s: Device['status']) {
  return DEVICE_STATUS[s]?.color || 'gray'
}

/* ============= 维护记录生成(按设备 id 确定性)=============
 * 要求:同设备每次进来内容一致;日期从近到远;故障设备第一条必须是故障维修
 * 实现思路:用设备 id 算出一个稳定的 hash 种子,从此选模板、算日期
 */

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// 参考日期(固定),确保刷新页面维护记录日期不变
const BASE_DATE = new Date('2026-10-14T00:00:00')
function offsetDate(daysAgo: number): string {
  const d = new Date(BASE_DATE)
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 维护记录模板池
const TEMPLATES: Record<string, Array<{ content: string; handler: string }>> = {
  '例行保养': [
    { content: '更换润滑油,清理机壳灰尘',          handler: '王伟' },
    { content: '紧固螺栓,检查电气线路',            handler: '李娜' },
    { content: '清理滤芯,补充液压油',              handler: '张静' },
  ],
  '巡检': [
    { content: '日常点检完成,各项参数正常',        handler: '刘强' },
    { content: '运行状态良好,无异常振动',          handler: '陈勇' },
    { content: '安全防护装置测试通过',             handler: '赵磊' },
  ],
  '故障维修': [
    { content: '主轴电机更换,精度恢复',            handler: '周婷' },
    { content: '液压系统维修,更换密封件',          handler: '吴军' },
    { content: '更换损坏的传感器',                  handler: '郑爽' },
  ],
}

interface MaintRecord {
  date: string
  type: '例行保养' | '巡检' | '故障维修'
  typeColor: 'blue' | 'red' | 'green'
  content: string
  handler: string
}

function buildRecords(d: Device): MaintRecord[] {
  const seed = hashCode(d.id)
  let types: Array<'例行保养' | '巡检' | '故障维修'>

  if (d.status === 'fault') {
    // 故障设备:第一条必须是故障维修
    types = ['故障维修', '例行保养', '巡检']
  } else if (d.status === 'maintain') {
    // 维护中:保养在前
    types = ['例行保养', '巡检', '故障维修']
  } else if (d.status === 'stopped') {
    types = ['故障维修', '巡检', '例行保养']
  } else {
    // 运行:轮换 3 种类型
    const order: Array<'例行保养' | '巡检' | '故障维修'> = ['例行保养', '巡检', '故障维修']
    types = [
      order[seed % 3],
      order[(seed + 1) % 3],
      order[(seed + 2) % 3],
    ]
  }

  // 日期分布:第一条 [5, 20] 天前 / 第二条 [30, 60] / 第三条 [70, 110]
  const ranges = [[5, 20], [30, 60], [70, 110]] as const
  const days = ranges.map((r, i) => r[0] + ((seed >> (i * 3)) % (r[1] - r[0] + 1)))

  return types.map((t, i) => {
    const pool = TEMPLATES[t]
    const item = pool[(seed + i * 7) % pool.length]
    return {
      date: offsetDate(days[i]),
      type: t,
      typeColor: t === '例行保养' ? 'blue' : t === '故障维修' ? 'red' : 'green',
      content: item.content,
      handler: item.handler,
    }
  })
}

const records = computed<MaintRecord[]>(() =>
  device.value ? buildRecords(device.value) : [],
)

// 操作
function goBack() { router.push('/device/list') }
function goCreateOrder() {
  if (!device.value) return
  router.push(`/order/create?deviceId=${device.value.id}`)
}
</script>

<template>
  <section v-if="device" class="device-detail">
    <!-- 顶部返回栏 -->
    <div class="head-row">
      <div class="head-left">
        <button class="back-btn" @click="goBack">← 返回台账</button>
        <h2 class="device-name">{{ device.name }}</h2>
        <span class="tag" :class="`tag-${statusColor(device.status)}`">
          {{ statusLabel(device.status) }}
        </span>
      </div>
    </div>

    <!-- 两列卡片:左基本信息 + 右维护记录 -->
    <div class="cards">
      <!-- 左:基本信息 -->
      <div class="card">
        <h3 class="card-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">设备编号</span>
            <span class="info-value">{{ device.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">设备类型</span>
            <span class="info-value">{{ device.type }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">设备型号</span>
            <span class="info-value">{{ device.model }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所在车间</span>
            <span class="info-value">{{ device.shop }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">负责人员</span>
            <span class="info-value">{{ device.owner }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">运行状态</span>
            <span class="info-value">
              <span class="tag" :class="`tag-${statusColor(device.status)}`">
                {{ statusLabel(device.status) }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">投产日期</span>
            <span class="info-value">{{ device.startDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最近保养</span>
            <span class="info-value">{{ device.lastMaint }}</span>
          </div>
        </div>
      </div>

      <!-- 右:维护记录 + 创建工单按钮 -->
      <div class="card">
        <h3 class="card-title">维护记录</h3>
        <ul class="timeline">
          <li v-for="(r, i) in records" :key="i" class="timeline-item">
            <div class="timeline-dot" :class="`dot-${r.typeColor}`"></div>
            <div class="timeline-body">
              <div class="timeline-head">
                <span class="timeline-date">{{ r.date }}</span>
                <span class="tag small" :class="`tag-${r.typeColor}`">{{ r.type }}</span>
              </div>
              <p class="timeline-content">{{ r.content }}</p>
              <p class="timeline-handler">处理人：{{ r.handler }}</p>
            </div>
          </li>
        </ul>
        <button class="btn primary full" @click="goCreateOrder">
          为此设备创建工单
        </button>
      </div>
    </div>
  </section>

  <!-- 设备编号无效时整页空状态 -->
  <section v-else class="empty-page">
    <div class="empty-card">
      <p class="empty-text">设备不存在或未选择设备</p>
      <button class="btn primary" @click="goBack">返回设备台账</button>
    </div>
  </section>
</template>

<style scoped>
.device-detail {
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
.head-left {
  display: flex;
  align-items: center;
  gap: 14px;
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
.back-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.device-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
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

/* 基本信息 */
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

/* 维护记录时间轴 */
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
  padding: 0 0 12px 22px;
}
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px #d8e1ee;
}
.dot-blue  { background: #2e7be2; }
.dot-red   { background: #e5454b; }
.dot-green { background: #2bbf6a; }
.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.timeline-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.timeline-date {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
}
.timeline-content {
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

/* 状态/类型标签 */
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
.btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.btn.primary {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.btn.primary:hover { opacity: 0.9; color: #fff; }
.btn.full { width: 100%; margin-top: 16px; }

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
  .cards {
    grid-template-columns: 1fr;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>