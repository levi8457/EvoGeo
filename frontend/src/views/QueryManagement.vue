<template>
  <div class="query-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>监测查询管理</span>
          <div class="header-actions">
            <el-select v-model="selectedBrandId" placeholder="筛选品牌" clearable style="width: 200px; margin-right: 12px" @change="fetchQueries">
              <el-option v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
            </el-select>
            <el-button type="primary" @click="showAddDialog = true">添加查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="queries" stripe v-loading="loading">
        <el-table-column prop="queryText" label="查询内容" min-width="300">
          <template #default="{ row }">
            <el-text line-clamp="2">{{ row.queryText }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="brandName" label="品牌" width="120" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可见性" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.avgVisibility" :color="getProgressColor(row.avgVisibility)" />
          </template>
        </el-table-column>
        <el-table-column prop="totalChecks" label="检测次数" width="100" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row.id)">详情</el-button>
            <el-button size="small" type="primary" @click="openCheckDialog(row)">检测</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加监测查询" width="500px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="品牌" required>
          <el-select v-model="addForm.brandId" placeholder="请选择品牌" style="width: 100%">
            <el-option v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="查询内容" required>
          <el-input v-model="addForm.queryText" type="textarea" :rows="3" placeholder="请输入查询内容" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="addForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="推荐类" value="推荐类" />
            <el-option label="对比类" value="对比类" />
            <el-option label="评测类" value="评测类" />
            <el-option label="通用" value="通用" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-rate v-model="addForm.priority" :max="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCheckDialog" title="立即检测" width="500px">
      <el-form label-width="80px">
        <el-form-item label="查询内容">
          <el-text>{{ currentQuery?.queryText }}</el-text>
        </el-form-item>
        <el-form-item label="检测平台">
          <el-checkbox-group v-model="selectedPlatforms">
            <el-checkbox v-for="platform in supportedPlatforms" :key="platform" :value="platform">
              {{ platform }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCheckDialog = false">取消</el-button>
        <el-button type="primary" :loading="checking" @click="handleCheck">开始检测</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { perceptionApi } from '@/api/perception'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const checking = ref(false)
const queries = ref<any[]>([])
const brands = ref<any[]>([])
const supportedPlatforms = ref<string[]>([])
const selectedBrandId = ref<string>('')

const showAddDialog = ref(false)
const showCheckDialog = ref(false)
const currentQuery = ref<any>(null)
const selectedPlatforms = ref<string[]>([])

const addForm = ref({
  brandId: '',
  queryText: '',
  category: '通用',
  priority: 3
})

onMounted(async () => {
  await Promise.all([
    fetchBrands(),
    fetchQueries(),
    fetchPlatforms()
  ])
})

const fetchBrands = async () => {
  try {
    brands.value = await perceptionApi.getBrands()
  } catch (error) {
    console.error('获取品牌列表失败:', error)
  }
}

const fetchQueries = async () => {
  loading.value = true
  try {
    queries.value = await perceptionApi.getQueries(selectedBrandId.value || undefined)
  } catch (error) {
    console.error('获取查询列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchPlatforms = async () => {
  try {
    const result = await perceptionApi.getSupportedPlatforms()
    supportedPlatforms.value = result.platforms
  } catch (error) {
    console.error('获取平台列表失败:', error)
  }
}

const handleAdd = async () => {
  if (!addForm.value.brandId || !addForm.value.queryText) {
    ElMessage.warning('请填写必填项')
    return
  }

  submitting.value = true
  try {
    await perceptionApi.createQuery(addForm.value)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    addForm.value = { brandId: '', queryText: '', category: '通用', priority: 3 }
    await fetchQueries()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确认删除此查询？', '提示', { type: 'warning' })
    await perceptionApi.deleteQuery(id)
    ElMessage.success('删除成功')
    await fetchQueries()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const viewDetails = (id: string) => {
  router.push(`/perception/queries/${id}`)
}

const openCheckDialog = (query: any) => {
  currentQuery.value = query
  selectedPlatforms.value = ['deepseek']
  showCheckDialog.value = true
}

const handleCheck = async () => {
  if (selectedPlatforms.value.length === 0) {
    ElMessage.warning('请选择至少一个平台')
    return
  }

  checking.value = true
  try {
    const result = await perceptionApi.runImmediateCheck(currentQuery.value.id, selectedPlatforms.value)
    ElMessage.success(`检测完成: ${result.successCount}/${result.totalPlatforms} 成功, ${result.mentionedCount} 次提及`)
    showCheckDialog.value = false
    await fetchQueries()
  } catch (error) {
    ElMessage.error('检测失败')
  } finally {
    checking.value = false
  }
}

const getPriorityType = (priority: number) => {
  if (priority >= 4) return 'danger'
  if (priority >= 3) return 'warning'
  return 'info'
}

const getProgressColor = (percentage: number) => {
  const numPercentage = Number(percentage);
  if (isNaN(numPercentage)) return '#f56c6c';
  if (numPercentage >= 70) return '#67c23a';
  if (numPercentage >= 40) return '#e6a23c';
  return '#f56c6c';
}
</script>

<style scoped>
.query-management {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>
