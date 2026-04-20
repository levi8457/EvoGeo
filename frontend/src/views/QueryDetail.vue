<template>
  <div class="query-detail">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">查询详情</span>
      </template>
    </el-page-header>

    <el-card v-loading="loading" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button type="primary" size="small" @click="openEditDialog">编辑</el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="查询内容" :span="3">
          {{ query?.queryText }}
        </el-descriptions-item>
        <el-descriptions-item label="品牌">{{ query?.brandName }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ query?.category }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(query?.priority)">{{ query?.priority }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="query?.isActive ? 'success' : 'info'">
            {{ query?.isActive ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(query?.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>可见性记录</span>
          <el-button type="primary" size="small" @click="openCheckDialog">立即检测</el-button>
        </div>
      </template>
      <el-table :data="query?.visibilityRecords || []" stripe>
        <el-table-column prop="platformName" label="平台" width="120" />
        <el-table-column prop="isMentioned" label="是否提及" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isMentioned ? 'success' : 'danger'">
              {{ row.isMentioned ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isFirstMention" label="首位提及" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isFirstMention" type="success">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="mentionPosition" label="提及位置" width="100">
          <template #default="{ row }">
            {{ row.mentionPosition ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="citationCount" label="引用次数" width="100" />
        <el-table-column prop="responseTimeMs" label="响应时间" width="120">
          <template #default="{ row }">
            {{ row.responseTimeMs ? `${row.responseTimeMs}ms` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="collectedAt" label="采集时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.collectedAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showEditDialog" title="编辑查询" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="查询内容">
          <el-input v-model="editForm.queryText" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" style="width: 100%">
            <el-option label="推荐类" value="推荐类" />
            <el-option label="对比类" value="对比类" />
            <el-option label="评测类" value="评测类" />
            <el-option label="通用" value="通用" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-rate v-model="editForm.priority" :max="5" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCheckDialog" title="立即检测" width="500px">
      <el-form label-width="80px">
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
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { perceptionApi } from '@/api/perception'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const checking = ref(false)
const query = ref<any>(null)
const supportedPlatforms = ref<string[]>([])
const selectedPlatforms = ref<string[]>([])

const showEditDialog = ref(false)
const showCheckDialog = ref(false)

const editForm = reactive({
  queryText: '',
  category: '',
  priority: 3,
  isActive: true
})

onMounted(async () => {
  await Promise.all([
    fetchQuery(),
    fetchPlatforms()
  ])
})

const fetchQuery = async () => {
  const id = route.params.id as string
  if (!id) return

  loading.value = true
  try {
    query.value = await perceptionApi.getQueryById(id)
  } catch (error) {
    ElMessage.error('获取查询详情失败')
    console.error(error)
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

const goBack = () => {
  router.push('/perception/queries')
}

const openEditDialog = () => {
  editForm.queryText = query.value?.queryText || ''
  editForm.category = query.value?.category || '通用'
  editForm.priority = query.value?.priority || 3
  editForm.isActive = query.value?.isActive ?? true
  showEditDialog.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    await perceptionApi.updateQuery(query.value.id, editForm)
    ElMessage.success('保存成功')
    showEditDialog.value = false
    await fetchQuery()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const openCheckDialog = () => {
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
    const result = await perceptionApi.runImmediateCheck(query.value.id, selectedPlatforms.value)
    ElMessage.success(`检测完成: ${result.successCount}/${result.totalPlatforms} 成功, ${result.mentionedCount} 次提及`)
    showCheckDialog.value = false
    await fetchQuery()
  } catch (error) {
    ElMessage.error('检测失败')
  } finally {
    checking.value = false
  }
}

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getPriorityType = (priority: number | undefined) => {
  if (!priority) return 'info'
  if (priority >= 4) return 'danger'
  if (priority >= 3) return 'warning'
  return 'info'
}
</script>

<style scoped>
.query-detail {
  padding: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
