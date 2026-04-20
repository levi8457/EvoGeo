import { createRouter, createWebHistory } from 'vue-router'
import PerceptionDashboard from '../views/PerceptionDashboard.vue'
import QueryManagement from '../views/QueryManagement.vue'
import QueryDetail from '../views/QueryDetail.vue'
import EvolutionDashboard from '../views/EvolutionDashboard.vue'
import StrategyManagement from '../views/StrategyManagement.vue'
import StrategyDetail from '../views/StrategyDetail.vue'
import GenerationDashboard from '../views/GenerationDashboard.vue'
import ContentManagement from '../views/ContentManagement.vue'
import MemoryManagement from '../views/MemoryManagement.vue'
import ExecutionDashboard from '../views/ExecutionDashboard.vue'
import ComplianceManagement from '../views/ComplianceManagement.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: PerceptionDashboard
    },
    {
      path: '/perception/dashboard',
      name: 'perception-dashboard',
      component: PerceptionDashboard
    },
    {
      path: '/perception/queries',
      name: 'query-management',
      component: QueryManagement
    },
    {
      path: '/perception/queries/:id',
      name: 'query-detail',
      component: QueryDetail
    },
    {
      path: '/evolution/dashboard',
      name: 'evolution-dashboard',
      component: EvolutionDashboard
    },
    {
      path: '/evolution/strategies',
      name: 'strategy-management',
      component: StrategyManagement
    },
    {
      path: '/evolution/strategies/:id',
      name: 'strategy-detail',
      component: StrategyDetail
    },
    {
      path: '/generation/dashboard',
      name: 'generation-dashboard',
      component: GenerationDashboard
    },
    {
      path: '/generation/contents',
      name: 'content-management',
      component: ContentManagement
    },
    {
      path: '/memory/management',
      name: 'memory-management',
      component: MemoryManagement
    },
    {
      path: '/execution/dashboard',
      name: 'execution-dashboard',
      component: ExecutionDashboard
    },
    {
      path: '/compliance/management',
      name: 'compliance-management',
      component: ComplianceManagement
    }
  ]
})

export default router
