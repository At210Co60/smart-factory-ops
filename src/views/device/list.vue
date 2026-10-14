<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { DEVICES, DEVICE_STATUS, type Device } from '@/mock/data'

const router = useRouter()

// 从 DEVICES 里去重出所有设备类型(供筛选下拉用)
const typeOptions = Array.from(new Set(DEVICES.map((d) => d.type)))

// ===== 顶部工具栏:关键字搜索 + 类型筛选 + 状态筛选 =====
const keyword = ref('')
// 实际参与搜索的关键字(防抖 350ms 后才更新)
const searchKey = ref('')
// 类型筛选('all' 时不过滤)
const typeFilter = ref('all')
// 状态筛选('all' 时不过滤)
const statusFilter = ref('all')

let timer: number | null = null
function onInputChange() {
  if (timer) clearTimeout(timer)
  timer = window.setTimeout(() => {
    searchKey.value = keyword.value.trim()
    pageNo.value = 1
  }, 350)
}
function onKeyEnter() {
  if (timer) clearTimeout(timer)
  searchKey.value = keyword.value.trim()
  pageNo.value = 1
}
function resetSearch() {
  keyword.value = ''
  searchKey.value = ''
  typeFilter.value = 'all'
  statusFilter.value = 'all'
  pageNo.value = 1
}
// 切换筛选条件时也回第 1 页
watch([typeFilter, statusFilter], () => { pageNo.value = 1 })
// 卸载时清掉定时器
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

// ===== 分页 =====
const pageNo = ref(1)
const pageSize = ref<5 | 10 | 20>(10)
// 切换每页条数时回到第 1 页
watch(pageSize, () => { pageNo.value = 1 })

// ===== 筛选(纯计算属性,不动原始数组)=====
const filteredList = computed<Device[]>(() => {
  const k = searchKey.value.trim().toLowerCase()
  return DEVICES.filter((d) => {
    // 关键字:名称 / 编号 / 型号 / 车间
    if (k) {
      const hit =
        d.name.toLowerCase().includes(k) ||
        d.id.toLowerCase().includes(k) ||
        d.model.toLowerCase().includes(k) ||
        d.shop.toLowerCase().includes(k)
      if (!hit) return false
    }
    // 类型
    if (typeFilter.value !== 'all' && d.type !== typeFilter.value) return false
    // 状态
    if (statusFilter.value !== 'all' && d.status !== statusFilter.value) return false
    return true
  })
})

const total = computed(() => filteredList.value.length)

// ===== 分页后的列表 =====
const pagedList = computed<Device[]>(() => {
  const start = (pageNo.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

// 总页数
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
// 修正页码(删空时)
watch(totalPages, () => {
  if (pageNo.value > totalPages.value) pageNo.value = totalPages.value
})

// 上一页 / 下一页
function prevPage() { if (pageNo.value > 1) pageNo.value-- }
function nextPage() { if (pageNo.value < totalPages.value) pageNo.value++ }

// 状态文案 + 颜色类名
function statusLabel(s: Device['status']) {
  return DEVICE_STATUS[s]?.label || '—'
}
function statusColor(s: Device['status']) {
  return DEVICE_STATUS[s]?.color || 'gray'
}

// 「详情」跳转(路由是 /device/detail/:id)
function goDetail(id: string) {
  router.push(`/device/detail/${id}`)
}
</script>

<template>
  <section class="device-list">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <input
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="搜索设备名称 / 编号 / 型号"
        @input="onInputChange"
        @keyup.enter="onKeyEnter"
      />
      <!-- 类型筛选 -->
      <select v-model="typeFilter" class="filter-select">
        <option value="all">全部类型</option>
        <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
      </select>
      <!-- 状态筛选 -->
      <select v-model="statusFilter" class="filter-select">
        <option value="all">全部状态</option>
        <option v-for="(s, k) in DEVICE_STATUS" :key="k" :value="k">{{ s.label }}</option>
      </select>
      <button class="btn primary" @click="onKeyEnter">查询</button>
      <button class="btn" @click="resetSearch">重置</button>
    </div>

    <!-- 数据表格 / 空状态 -->
    <div class="table-card">
      <table v-if="pagedList.length" class="data-table">
        <thead>
          <tr>
            <th>设备编号</th>
            <th>设备名称</th>
            <th>类型</th>
            <th>所在车间</th>
            <th>负责人</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in pagedList" :key="d.id">
            <td>{{ d.id }}</td>
            <td>{{ d.name }}</td>
            <td>{{ d.type }}</td>
            <td>{{ d.shop }}</td>
            <td>{{ d.owner }}</td>
            <td>
              <span class="tag" :class="`tag-${statusColor(d.status)}`">
                {{ statusLabel(d.status) }}
              </span>
            </td>
            <td>
              <button class="link-btn" @click="goDetail(d.id)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 表格区空状态 -->
      <div v-else class="empty">
        <p>未找到匹配的设备</p>
      </div>
    </div>

    <!-- 底部分页 -->
    <div class="pagination" v-if="total > 0">
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
  </section>
</template>

<style scoped>
.device-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部工具栏 */
.toolbar {
  background: #fff;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(16, 48, 95, 0.05);
}

.search-input {
  flex: 1;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: var(--primary);
}

/* 筛选下拉 */
.filter-select {
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-main);
  background: #fff;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.filter-select:focus {
  border-color: var(--primary);
}

.btn {
  border: 1px solid #d8e1ee;
  background: #fff;
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}
.btn.primary {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.btn.primary:hover {
  opacity: 0.9;
  color: #fff;
}
.btn.small {
  padding: 5px 12px;
  font-size: 12px;
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

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
.data-table tbody tr:hover {
  background: #fafcff;
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}
.link-btn:hover {
  text-decoration: underline;
}

/* 状态标签 */
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

/* 表格区空状态 */
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

.page-size {
  font-size: 13px;
  color: var(--text-sub);
}
.page-size-select {
  border: 1px solid #d8e1ee;
  border-radius: 6px;
  padding: 3px 6px;
  margin: 0 4px;
  font-size: 13px;
}

.pager {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-no {
  font-size: 13px;
  color: var(--text-sub);
  margin: 0 6px;
}

.total {
  font-size: 13px;
  color: var(--text-sub);
}

/* 手机端表格横向滚动 */
@media (max-width: 720px) {
  .toolbar {
    flex-wrap: wrap;
  }
  .table-card {
    overflow-x: auto;
  }
  .data-table {
    min-width: 720px;
  }
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
}
</style>