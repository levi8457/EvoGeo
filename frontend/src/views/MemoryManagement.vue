<template>
  <div class="memory-management">
    <h1 class="page-title">记忆管理</h1>

    <div class="brand-selector">
      <el-select v-model="selectedBrand" placeholder="选择品牌" @change="loadMemoryEntries">
        <el-option
          v-for="brand in brands"
          :key="brand.id"
          :label="brand.name"
          :value="brand.id"
        />
      </el-select>
    </div>

    <div class="filter-container">
      <el-select v-model="filters.memoryType" placeholder="记忆类型" @change="loadMemoryEntries">
        <el-option label="全部" value="" />
        <el-option label="品牌信息" value="brand_info" />
        <el-option label="策略信息" value="strategy_info" />
        <el-option label="内容信息" value="content_info" />
        <el-option label="用户反馈" value="user_feedback" />
        <el-option label="其他" value="other" />
      </el-select>

      <el-select v-model="filters.importance" placeholder="重要性" @change="loadMemoryEntries">
        <el-option label="全部" value="" />
        <el-option label="1 - 低" :value="1" />
        <el-option label="2" :value="2" />
        <el-option label="3 - 中" :value="3" />
        <el-option label="4" :value="4" />
        <el-option label="5 - 高" :value="5" />
      </el-select>
    </div>

    <div class="action-buttons">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 添加记忆
      </el-button>
    </div>

    <el-card shadow="hover" class="memory-list-card">
      <template #header>
        <div class="card-header">
          <span>记忆条目列表</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索记忆键"
            prefix-icon="Search"
            style="width: 200px"
            @input="handleSearch"
          />
        </div>
      </template>

      <el-table :data="memoryEntries" style="width: 100%" stripe>
        <el-table-column prop="memoryKey" label="记忆键" min-width="200" />
        <el-table-column prop="memoryType" label="类型" width="120" />
        <el-table-column prop="importance" label="重要性" width="100">
          <template #default="scope">
            <el-rate v-model="scope.row.importance" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="accessCount" label="访问次数" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="lastAccessedAt" label="最后访问" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewMemory(scope.row.id)">
              查看
            </el-button>
            <el-button size="small" type="primary" @click="editMemory(scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deleteMemory(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="showAddDialog"
      :title="editMode ? '编辑记忆' : '添加记忆'"
      width="500px"
    >
      <el-form :model="memoryForm" label-width="100px">
        <el-form-item label="记忆类型">
          <el-select v-model="memoryForm.memoryType" placeholder="选择记忆类型">
            <el-option label="品牌信息" value="brand_info" />
            <el-option label="策略信息" value="strategy_info" />
            <el-option label="内容信息" value="content_info" />
            <el-option label="用户反馈" value="user_feedback" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="记忆键">
          <el-input v-model="memoryForm.memoryKey" placeholder="输入记忆键" />
        </el-form-item>
        <el-form-item label="记忆内容">
          <el-input
            v-model="memoryForm.content"
            type="textarea"
            :rows="4"
            placeholder="输入记忆内容"
          />
        </el-form-item>
        <el-form-item label="重要性">
          <el-rate v-model="memoryForm.importance" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveMemory">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showMemoryDialog"
      title="记忆详情"
      width="800px"
    >
      <div v-if="currentMemory" class="memory-detail">
        <h2>{{ currentMemory.memoryKey }}</h2>
        <div class="memory-meta">
          <span>类型: {{ currentMemory.memoryType }}</span>
          <span>重要性: {{ currentMemory.importance }}/5</span>
          <span>访问次数: {{ currentMemory.accessCount }}</span>
          <span>创建时间: {{ currentMemory.createdAt }}</span>
          <span v-if="currentMemory.lastAccessedAt">最后访问: {{ currentMemory.lastAccessedAt }}</span>
        </div>
        <div class="memory-content">
          {{ currentMemory.content }}
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMemoryDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { MemoryService } from '../api/memory';
import { perceptionApi } from '../api/perception';

interface MemoryEntry {
  id: string;
  memoryKey: string;
  memoryType: string;
  content: string;
  importance: number;
  accessCount: number;
  createdAt: string;
  lastAccessedAt?: string;
}

const selectedBrand = ref('');
const brands = ref<Array<{id: string; name: string}>>([]);

const filters = ref({
  memoryType: '',
  importance: '' as string | number | '',
});

const searchKeyword = ref('');
const memoryEntries = ref<MemoryEntry[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const showAddDialog = ref(false);
const showMemoryDialog = ref(false);
const editMode = ref(false);

const memoryForm = ref({
  memoryType: '',
  memoryKey: '',
  content: '',
  importance: 1,
});

const currentMemoryId = ref('');
const currentMemory = ref<MemoryEntry | null>(null);

const loadBrands = async () => {
  try {
    const data = await perceptionApi.getBrands();
    brands.value = data || [];
    if (brands.value.length > 0 && !selectedBrand.value) {
      selectedBrand.value = brands.value[0].id;
    }
  } catch (error) {
    console.error('加载品牌失败:', error);
  }
};

const loadMemoryEntries = async () => {
  if (!selectedBrand.value) return;

  try {
    const params: { brandId: string; memoryType?: string; importance?: number } = {
      brandId: selectedBrand.value,
    };
    if (filters.value.memoryType) {
      params.memoryType = filters.value.memoryType;
    }
    if (filters.value.importance) {
      params.importance = parseInt(filters.value.importance as string);
    }

    const data = await MemoryService.getMemoryEntries(params);

    let filteredData = data;
    if (searchKeyword.value) {
      filteredData = data.filter((item: MemoryEntry) =>
        item.memoryKey?.includes(searchKeyword.value)
      );
    }

    total.value = filteredData.length;
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    memoryEntries.value = filteredData.slice(start, end);
  } catch (error) {
    console.error('加载记忆条目列表失败:', error);
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadMemoryEntries();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  loadMemoryEntries();
};

const handleCurrentChange = (current: number) => {
  currentPage.value = current;
  loadMemoryEntries();
};

const saveMemory = async () => {
  if (!selectedBrand.value || !memoryForm.value.memoryType || !memoryForm.value.memoryKey || !memoryForm.value.content) {
    ElMessage.error('请填写完整的记忆信息');
    return;
  }

  try {
    if (editMode.value && currentMemoryId.value) {
      await MemoryService.updateMemoryEntry(currentMemoryId.value, {
        content: memoryForm.value.content,
        importance: memoryForm.value.importance,
      });
      ElMessage.success('记忆更新成功');
    } else {
      await MemoryService.createMemoryEntry({
        brandId: selectedBrand.value,
        memoryType: memoryForm.value.memoryType,
        memoryKey: memoryForm.value.memoryKey,
        content: memoryForm.value.content,
        importance: memoryForm.value.importance,
      });
      ElMessage.success('记忆添加成功');
    }

    showAddDialog.value = false;
    loadMemoryEntries();
    resetForm();
  } catch (error) {
    console.error('保存记忆失败:', error);
    ElMessage.error('保存记忆失败');
  }
};

const viewMemory = async (id: string) => {
  try {
    const memory = await MemoryService.getMemoryEntryById(id);
    currentMemory.value = memory;
    showMemoryDialog.value = true;
  } catch (error) {
    console.error('获取记忆详情失败:', error);
    ElMessage.error('获取记忆详情失败');
  }
};

const editMemory = (memory: MemoryEntry) => {
  memoryForm.value = {
    memoryType: memory.memoryType,
    memoryKey: memory.memoryKey,
    content: memory.content,
    importance: memory.importance,
  };
  currentMemoryId.value = memory.id;
  editMode.value = true;
  showAddDialog.value = true;
};

const deleteMemory = async (id: string) => {
  try {
    await MemoryService.deleteMemoryEntry(id);
    ElMessage.success('记忆删除成功');
    loadMemoryEntries();
  } catch (error) {
    console.error('删除记忆失败:', error);
    ElMessage.error('删除记忆失败');
  }
};

const resetForm = () => {
  memoryForm.value = {
    memoryType: '',
    memoryKey: '',
    content: '',
    importance: 1,
  };
  currentMemoryId.value = '';
  editMode.value = false;
};

onMounted(async () => {
  await loadBrands();
  await loadMemoryEntries();
});
</script>

<style scoped>
.memory-management {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 100px);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 30px;
  color: #333;
}

.brand-selector {
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.action-buttons {
  margin-bottom: 20px;
}

.memory-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.memory-detail {
  padding: 20px;
}

.memory-detail h2 {
  margin-bottom: 20px;
  color: #333;
}

.memory-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
}

.memory-content {
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .filter-container {
    flex-direction: column;
  }

  .memory-meta {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
