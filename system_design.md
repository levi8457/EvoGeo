# EvoGEO MVP - 研发执行规范文档

> **System Requirements Specification**
> 版本：1.0 | 最后更新：2026-04

---

## 📋 目录

- [1. 全局架构约束](#1-全局架构约束)
- [2. 数据库设计表结构](#2-数据库设计表结构)
- [3. 核心功能模块工程化拆解](#3-核心功能模块工程化拆解)

---

## 1. 全局架构约束

### 1.1 技术栈定义

#### 前端技术栈

| 类别 | 技术 | 版本要求 |
|------|------|----------|
| 框架 | Vue | 3.4+ |
| 语言 | TypeScript | 5.0+ |
| UI 组件库 | Element Plus | 2.5+ |
| 状态管理 | Pinia | 2.1+ |
| 路由 | Vue Router | 4.2+ |
| HTTP 客户端 | Axios | 1.6+ |
| 图表库 | ECharts | 5.4+ |
| 构建工具 | Vite | 5.0+ |

#### 后端技术栈

| 类别 | 技术 | 版本要求 |
|------|------|----------|
| 框架 | NestJS | 10.0+ |
| 语言 | TypeScript | 5.0+ |
| ORM | TypeORM | 0.3+ |
| 关系数据库 | PostgreSQL | 15+ |
| 向量数据库 | ChromaDB | 0.4+ |
| 任务调度 | node-cron | 3.0+ |
| LLM SDK | OpenAI SDK | 4.0+ (兼容多模型) |
| 缓存 | Redis | 7.0+ (可选) |

---

### 1.2 项目结构约束

```
evogeo-project/
├── frontend/                 # Vue3 前端
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── api/             # API 接口封装
│   │   ├── types/           # TypeScript 类型定义
│   │   └── utils/           # 工具函数
│   └── package.json
├── backend/                  # NestJS 后端
│   ├── src/
│   │   ├── modules/         # 功能模块
│   │   │   ├── perception/  # 感知层
│   │   │   ├── evolution/   # 进化层
│   │   │   ├── execution/   # 执行层
│   │   │   ├── memory/      # 记忆系统
│   │   │   └── compliance/  # 合规检测
│   │   ├── entities/        # 数据库实体
│   │   ├── dto/             # 数据传输对象
│   │   └── common/          # 公共模块
│   └── package.json
└── docker-compose.yml        # 容器编排
```

---

### 1.3 核心架构原则

| 原则 | 说明 |
|------|------|
| 🔗 **前后端分离** | 前端通过 RESTful API 与后端通信 |
| 📦 **模块化设计** | 每个功能层独立为 NestJS Module |
| ⚡ **异步任务处理** | 长时间任务（AI 调用、数据采集）使用队列机制 |
| 💾 **数据持久化** | 结构化数据存 PostgreSQL，向量数据存 ChromaDB |
| 🚦 **API 限流** | 对第三方 AI 平台调用实施速率控制 |
| 📝 **错误追踪** | 所有 AI 调用失败需记录日志并重试 |

---

## 2. 数据库设计表结构

### 2.1 核心业务表

#### 2.1.1 brands（品牌主体表）

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brands_name ON brands(name);
```

#### 2.1.2 monitoring_queries（监测查询表）

```sql
CREATE TABLE monitoring_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  category VARCHAR(50),
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_monitoring_queries_brand ON monitoring_queries(brand_id);
CREATE INDEX idx_monitoring_queries_active ON monitoring_queries(is_active);
```

#### 2.1.3 ai_platforms（AI 平台配置表）

```sql
CREATE TABLE ai_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name VARCHAR(100) NOT NULL UNIQUE,
  api_endpoint VARCHAR(500),
  api_key_encrypted TEXT,
  model_name VARCHAR(100),
  rate_limit_per_minute INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**预置数据：**

| 平台名称 | 模型 |
|----------|------|
| DeepSeek | deepseek-chat |
| 豆包 | doubao-pro |
| 文心一言 | ernie-4.0 |
| 通义千问 | qwen-max |
| Kimi | moonshot-v1 |
| 元宝 | hunyuan-pro |
| ChatGPT | gpt-4o |

```sql
INSERT INTO ai_platforms (platform_name, model_name) VALUES
  ('deepseek', 'deepseek-chat'),
  ('doubao', 'doubao-pro'),
  ('wenxin', 'ernie-4.0'),
  ('tongyi', 'qwen-max'),
  ('kimi', 'moonshot-v1'),
  ('yuanbao', 'hunyuan-pro'),
  ('chatgpt', 'gpt-4o');
```

#### 2.1.4 visibility_records（可见性监测记录表）

```sql
CREATE TABLE visibility_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  query_id UUID REFERENCES monitoring_queries(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES ai_platforms(id) ON DELETE CASCADE,

  -- 监测指标
  is_mentioned BOOLEAN DEFAULT FALSE,
  mention_position INTEGER,
  is_first_mention BOOLEAN DEFAULT FALSE,
  citation_count INTEGER DEFAULT 0,
  citation_snippet TEXT,
  answer_full_text TEXT,

  -- 竞品对比
  competitor_mentions JSONB,

  -- 元数据
  collected_at TIMESTAMP DEFAULT NOW(),
  response_time_ms INTEGER
);

CREATE INDEX idx_visibility_brand_query ON visibility_records(brand_id, query_id);
CREATE INDEX idx_visibility_platform ON visibility_records(platform_id);
CREATE INDEX idx_visibility_collected_at ON visibility_records(collected_at);
```

#### 2.1.5 optimization_strategies（优化策略存档表）

```sql
CREATE TABLE optimization_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  -- 策略内容
  strategy_type VARCHAR(50) NOT NULL,
  content_template TEXT,
  parameters JSONB,

  -- 进化指标
  generation INTEGER DEFAULT 1,
  fitness_score FLOAT DEFAULT 0.0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  -- MAP-Elites 存档维度
  archive_dimension_1 VARCHAR(100),
  archive_dimension_2 VARCHAR(100),

  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_strategies_brand ON optimization_strategies(brand_id);
CREATE INDEX idx_strategies_fitness ON optimization_strategies(fitness_score DESC);
CREATE INDEX idx_strategies_archive ON optimization_strategies(archive_dimension_1, archive_dimension_2);
```

#### 2.1.6 generated_contents（生成内容表）

```sql
CREATE TABLE generated_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES optimization_strategies(id) ON DELETE SET NULL,

  -- 内容信息
  content_type VARCHAR(50) NOT NULL,
  title VARCHAR(500),
  body TEXT NOT NULL,
  keywords TEXT[],
  target_query VARCHAR(500),

  -- 效果追踪
  deployment_status VARCHAR(20) DEFAULT 'draft',
  deployed_at TIMESTAMP,
  visibility_improvement FLOAT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contents_brand ON generated_contents(brand_id);
CREATE INDEX idx_contents_strategy ON generated_contents(strategy_id);
```

#### 2.1.7 memory_entries（记忆系统表）

```sql
CREATE TABLE memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  -- 记忆内容
  memory_type VARCHAR(50) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  embedding_id VARCHAR(255),

  -- 元数据
  importance_score FLOAT DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(brand_id, memory_type, key)
);

CREATE INDEX idx_memory_brand_type ON memory_entries(brand_id, memory_type);
CREATE INDEX idx_memory_importance ON memory_entries(importance_score DESC);
```

#### 2.1.8 compliance_checks（合规检测记录表）

```sql
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES generated_contents(id) ON DELETE CASCADE,

  -- 检测结果
  check_type VARCHAR(50) NOT NULL,
  is_compliant BOOLEAN DEFAULT TRUE,
  risk_level VARCHAR(20),
  issues JSONB,
  suggestions TEXT,

  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compliance_content ON compliance_checks(content_id);
CREATE INDEX idx_compliance_risk ON compliance_checks(risk_level);
```

#### 2.1.9 critic_feedback（Critic 评估器反馈表）

```sql
CREATE TABLE critic_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES optimization_strategies(id) ON DELETE CASCADE,
  query_id UUID REFERENCES monitoring_queries(id) ON DELETE CASCADE,

  -- 评估结果
  predicted_score FLOAT,
  actual_score FLOAT,
  prediction_error FLOAT,

  -- 学习数据
  features JSONB,
  feedback_text TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_critic_strategy ON critic_feedback(strategy_id);
CREATE INDEX idx_critic_error ON critic_feedback(prediction_error);
```

---

### 2.2 ChromaDB 向量集合设计

```typescript
interface ChromaCollections {
  brand_knowledge: {
    // 品牌知识库向量
    documents: string[],      // 品牌相关文档内容
    metadatas: {
      brand_id: string,
      doc_type: string,
      source_url?: string,
      created_at: string
    }[]
  },

  strategy_embeddings: {
    // 策略向量（用于相似策略检索）
    documents: string[],      // 策略描述文本
    metadatas: {
      strategy_id: string,
      fitness_score: number,
      success_rate: number
    }[]
  },

  query_patterns: {
    // 查询模式向量（用于问题聚类）
    documents: string[],      // 查询文本
    metadatas: {
      query_id: string,
      category: string,
      frequency: number
    }[]
  }
}
```

---

## 3. 核心功能模块工程化拆解

### 3.1 模块一：感知层（Perception Layer）

> 📍 **页面路由**: `/perception/dashboard`

#### 3.1.1 前端页面组件

**views/PerceptionDashboard.vue**

```vue
<template>
  <div class="perception-dashboard">
    <!-- 顶部筛选器 -->
    <el-card class="filter-card">
      <BrandSelector v-model="selectedBrandId" />
      <DateRangePicker v-model="dateRange" />
      <PlatformFilter v-model="selectedPlatforms" />
    </el-card>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <MetricCard
          title="平均可见性"
          :value="metrics.avgVisibility"
          unit="%"
          trend="up" />
      </el-col>
      <el-col :span="6">
        <MetricCard
          title="首位提及率"
          :value="metrics.firstMentionRate"
          unit="%" />
      </el-col>
      <el-col :span="6">
        <MetricCard
          title="引用次数"
          :value="metrics.totalCitations" />
      </el-col>
      <el-col :span="6">
        <MetricCard
          title="监测平台数"
          :value="metrics.platformCount" />
      </el-col>
    </el-row>

    <!-- 可见性趋势图 -->
    <el-card class="chart-card">
      <VisibilityTrendChart :data="trendData" />
    </el-card>

    <!-- 平台对比表格 -->
    <el-card class="table-card">
      <PlatformComparisonTable :data="platformData" />
    </el-card>

    <!-- 竞品对比雷达图 -->
    <el-card class="chart-card">
      <CompetitorRadarChart :data="competitorData" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePerceptionStore } from '@/stores/perception'

const perceptionStore = usePerceptionStore()
const selectedBrandId = ref<string>('')
const dateRange = ref<[Date, Date]>([])
const selectedPlatforms = ref<string[]>([])

const metrics = computed(() => perceptionStore.metrics)
const trendData = computed(() => perceptionStore.trendData)
const platformData = computed(() => perceptionStore.platformData)
const competitorData = computed(() => perceptionStore.competitorData)

onMounted(() => {
  perceptionStore.fetchDashboardData()
})

watch([selectedBrandId, dateRange, selectedPlatforms], () => {
  perceptionStore.fetchDashboardData({
    brandId: selectedBrandId.value,
    dateRange: dateRange.value,
    platforms: selectedPlatforms.value
  })
})
</script>
```

---

> 📍 **页面路由**: `/perception/queries`

**views/QueryManagement.vue**

```vue
<template>
  <div class="query-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>监测查询管理</span>
          <el-button type="primary" @click="showAddDialog = true">
            添加查询
          </el-button>
        </div>
      </template>

      <!-- 查询列表表格 -->
      <el-table :data="queries" stripe>
        <el-table-column prop="queryText" label="查询内容" width="300" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="priority" label="优先级" width="100" />
        <el-table-column label="可见性" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.avgVisibility"
              :color="getProgressColor(row.avgVisibility)" />
          </template>
        </el-table-column>
        <el-table-column prop="lastChecked" label="最后检测" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row.id)">
              详情
            </el-button>
            <el-button size="small" @click="runCheck(row.id)">
              立即检测
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteQuery(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加查询对话框 -->
    <AddQueryDialog v-model="showAddDialog" @success="refreshQueries" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQueryStore } from '@/stores/query'

const queryStore = useQueryStore()
const queries = computed(() => queryStore.queries)
const showAddDialog = ref(false)

onMounted(() => {
  queryStore.fetchQueries()
})

const viewDetails = (queryId: string) => {
  router.push(`/perception/queries/${queryId}`)
}

const runCheck = async (queryId: string) => {
  await queryStore.runImmediateCheck(queryId)
  ElMessage.success('检测任务已启动')
}

const deleteQuery = async (queryId: string) => {
  await ElMessageBox.confirm('确认删除此查询？')
  await queryStore.deleteQuery(queryId)
  refreshQueries()
}

const refreshQueries = () => {
  queryStore.fetchQueries()
}
</script>
```

---

#### 3.1.2 Pinia 状态管理

**stores/perception.ts**

```typescript
import { defineStore } from 'pinia'
import { perceptionApi } from '@/api/perception'

export const usePerceptionStore = defineStore('perception', {
  state: () => ({
    metrics: {
      avgVisibility: 0,
      firstMentionRate: 0,
      totalCitations: 0,
      platformCount: 0
    },
    trendData: [] as TrendDataPoint[],
    platformData: [] as PlatformData[],
    competitorData: [] as CompetitorData[],
    loading: false
  }),

  actions: {
    async fetchDashboardData(filters?: DashboardFilters) {
      this.loading = true
      try {
        const response = await perceptionApi.getDashboardData(filters)
        this.metrics = response.metrics
        this.trendData = response.trendData
        this.platformData = response.platformData
        this.competitorData = response.competitorData
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        this.loading = false
      }
    }
  }
})
```

---

#### 3.1.3 后端 API 接口

**backend/src/modules/perception/perception.controller.ts**

```typescript
@Controller('api/perception')
export class PerceptionController {
  constructor(private readonly perceptionService: PerceptionService) {}

  @Get('dashboard')
  async getDashboardData(@Query() filters: DashboardFiltersDto) {
    return this.perceptionService.getDashboardData(filters)
  }

  @Get('visibility-records')
  async getVisibilityRecords(
    @Query('brandId') brandId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.perceptionService.getVisibilityRecords(brandId, startDate, endDate)
  }

  @Post('run-check')
  async runImmediateCheck(@Body() dto: RunCheckDto) {
    return this.perceptionService.runImmediateCheck(dto.queryId, dto.platforms)
  }

  @Get('competitor-analysis')
  async getCompetitorAnalysis(
    @Query('brandId') brandId: string,
    @Query('queryId') queryId: string
  ) {
    return this.perceptionService.getCompetitorAnalysis(brandId, queryId)
  }
}
```

**backend/src/modules/perception/perception.service.ts**

```typescript
@Injectable()
export class PerceptionService {
  constructor(
    @InjectRepository(VisibilityRecord)
    private visibilityRepo: Repository<VisibilityRecord>,
    @InjectRepository(MonitoringQuery)
    private queryRepo: Repository<MonitoringQuery>,
    private aiPlatformService: AiPlatformService
  ) {}

  async getDashboardData(filters: DashboardFiltersDto) {
    const { brandId, startDate, endDate, platforms } = filters

    // 计算平均可见性
    const avgVisibility = await this.visibilityRepo
      .createQueryBuilder('vr')
      .select('AVG(CASE WHEN vr.is_mentioned THEN 100 ELSE 0 END)', 'avg')
      .where('vr.brand_id = :brandId', { brandId })
      .andWhere('vr.collected_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne()

    // 计算首位提及率
    const firstMentionRate = await this.visibilityRepo
      .createQueryBuilder('vr')
      .select('AVG(CASE WHEN vr.is_first_mention THEN 100 ELSE 0 END)', 'rate')
      .where('vr.brand_id = :brandId', { brandId })
      .andWhere('vr.collected_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne()

    // 获取趋势数据
    const trendData = await this.visibilityRepo
      .createQueryBuilder('vr')
      .select('DATE(vr.collected_at)', 'date')
      .addSelect('AVG(CASE WHEN vr.is_mentioned THEN 100 ELSE 0 END)', 'visibility')
      .where('vr.brand_id = :brandId', { brandId })
      .andWhere('vr.collected_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(vr.collected_at)')
      .orderBy('date', 'ASC')
      .getRawMany()

    // 获取平台对比数据
    const platformData = await this.visibilityRepo
      .createQueryBuilder('vr')
      .leftJoin('vr.platform', 'p')
      .select('p.platform_name', 'platformName')
      .addSelect('AVG(CASE WHEN vr.is_mentioned THEN 100 ELSE 0 END)', 'visibility')
      .addSelect('AVG(vr.citation_count)', 'avgCitations')
      .addSelect('COUNT(*)', 'totalChecks')
      .where('vr.brand_id = :brandId', { brandId })
      .groupBy('p.platform_name')
      .getRawMany()

    return {
      metrics: {
        avgVisibility: parseFloat(avgVisibility.avg) || 0,
        firstMentionRate: parseFloat(firstMentionRate.rate) || 0,
        totalCitations: await this.getTotalCitations(brandId, startDate, endDate),
        platformCount: platformData.length
      },
      trendData,
      platformData,
      competitorData: await this.getCompetitorData(brandId)
    }
  }

  async runImmediateCheck(queryId: string, platforms: string[]) {
    const query = await this.queryRepo.findOne({ where: { id: queryId } })
    if (!query) throw new NotFoundException('Query not found')

    const results = []
    for (const platformName of platforms) {
      const result = await this.aiPlatformService.queryPlatform(
        platformName,
        query.queryText,
        query.brandId
      )
      results.push(result)
    }

    return { success: true, results }
  }
}
```

---

#### 3.1.4 AI 平台调用服务

**backend/src/modules/perception/ai-platform.service.ts**

```typescript
@Injectable()
export class AiPlatformService {
  constructor(
    @InjectRepository(AiPlatform)
    private platformRepo: Repository<AiPlatform>,
    @InjectRepository(VisibilityRecord)
    private visibilityRepo: Repository<VisibilityRecord>
  ) {}

  async queryPlatform(platformName: string, queryText: string, brandId: string) {
    const platform = await this.platformRepo.findOne({
      where: { platformName, isEnabled: true }
    })
    if (!platform) throw new NotFoundException(`Platform ${platformName} not found`)

    const startTime = Date.now()

    try {
      // 调用 AI 平台 API
      const response = await this.callPlatformAPI(platform, queryText)
      const responseTime = Date.now() - startTime

      // 解析回答，提取品牌提及信息
      const analysis = this.analyzeResponse(response, brandId)

      // 保存监测记录
      const record = this.visibilityRepo.create({
        brandId,
        platformId: platform.id,
        isMentioned: analysis.isMentioned,
        mentionPosition: analysis.mentionPosition,
        isFirstMention: analysis.isFirstMention,
        citationCount: analysis.citationCount,
        citationSnippet: analysis.citationSnippet,
        answerFullText: response.text,
        competitorMentions: analysis.competitorMentions,
        responseTimeMs: responseTime
      })

      await this.visibilityRepo.save(record)

      return { success: true, record }
    } catch (error) {
      console.error(`Failed to query ${platformName}:`, error)
      throw error
    }
  }

  private async callPlatformAPI(platform: AiPlatform, queryText: string) {
    // 根据平台类型调用不同的 API
    switch (platform.platformName) {
      case 'deepseek':
        return this.callDeepSeek(platform, queryText)
      case 'chatgpt':
        return this.callChatGPT(platform, queryText)
      // ... 其他平台
      default:
        throw new Error(`Unsupported platform: ${platform.platformName}`)
    }
  }

  private async callChatGPT(platform: AiPlatform, queryText: string) {
    const openai = new OpenAI({ apiKey: platform.apiKeyEncrypted })
    const completion = await openai.chat.completions.create({
      model: platform.modelName,
      messages: [{ role: 'user', content: queryText }]
    })
    return { text: completion.choices[0].message.content }
  }

  private analyzeResponse(response: any, brandId: string): AnalysisResult {
    const text = response.text
    // 使用正则或 NLP 分析品牌提及
    const brandMentions = this.extractBrandMentions(text, brandId)

    return {
      isMentioned: brandMentions.length > 0,
      mentionPosition: brandMentions[0]?.position || null,
      isFirstMention: brandMentions[0]?.position === 0,
      citationCount: brandMentions.length,
      citationSnippet: brandMentions[0]?.snippet || null,
      competitorMentions: this.extractCompetitorMentions(text)
    }
  }
}
```

---

#### 3.1.5 定时任务调度

**backend/src/modules/perception/perception.scheduler.ts**

```typescript
@Injectable()
export class PerceptionScheduler {
  constructor(
    private perceptionService: PerceptionService,
    @InjectRepository(MonitoringQuery)
    private queryRepo: Repository<MonitoringQuery>
  ) {}

  // 每天早上 8 点执行全量监测
  @Cron('0 8 * * *')
  async runDailyMonitoring() {
    console.log('Starting daily monitoring...')

    const activeQueries = await this.queryRepo.find({
      where: { isActive: true },
      relations: ['brand']
    })

    for (const query of activeQueries) {
      try {
        await this.perceptionService.runImmediateCheck(
          query.id,
          ['deepseek', 'chatgpt', 'wenxin', 'tongyi', 'kimi']
        )
      } catch (error) {
        console.error(`Failed to check query ${query.id}:`, error)
      }
    }

    console.log('Daily monitoring completed')
  }

  // 每小时检查高优先级查询
  @Cron('0 * * * *')
  async runHourlyHighPriorityCheck() {
    const highPriorityQueries = await this.queryRepo.find({
      where: { isActive: true, priority: MoreThanOrEqual(3) }
    })

    for (const query of highPriorityQueries) {
      await this.perceptionService.runImmediateCheck(query.id, ['deepseek', 'chatgpt'])
    }
  }
}
```

---

### 3.2 模块二：进化层（Evolution Layer）

> 📍 **页面路由**: `/evolution/strategies`

#### 3.2.1 前端页面组件

**views/StrategyEvolution.vue**

```vue
<template>
  <div class="strategy-evolution">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>策略进化存档</span>
          <el-button type="primary" @click="triggerEvolution">
            触发进化
          </el-button>
        </div>
      </template>

      <!-- MAP-Elites 存档可视化 -->
      <div class="archive-grid">
        <ArchiveHeatmap :data="archiveData" @cell-click="viewStrategy" />
      </div>

      <!-- 策略列表 -->
      <el-table :data="strategies" stripe>
        <el-table-column prop="strategyType" label="策略类型" width="150" />
        <el-table-column prop="generation" label="代数" width="100" />
        <el-table-column label="适应度" width="120">
          <template #default="{ row }">
            <el-tag :type="getFitnessTagType(row.fitnessScore)">
              {{ row.fitnessScore.toFixed(2) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成功率" width="120">
          <template #default="{ row }">
            {{ calculateSuccessRate(row) }}%
          </template>
        </el-table-column>
        <el-table-column prop="lastUsedAt" label="最后使用" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewStrategyDetail(row.id)">
              详情
            </el-button>
            <el-button size="small" @click="applyStrategy(row.id)">
              应用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
```

---

> 📝 **文档持续更新中...**
