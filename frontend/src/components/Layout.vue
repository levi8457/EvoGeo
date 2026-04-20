<template>
  <div class="layout-container">
    <!-- 侧边栏导航 -->
    <aside class="sidebar">
      <div class="logo">
        <h1>Evogeo</h1>
        <p>AI 品牌可见性优化系统</p>
      </div>
      <nav class="navigation">
        <ul>
          <li>
            <router-link to="/perception/dashboard" class="nav-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>感知大屏</span>
            </router-link>
          </li>
          <li>
            <router-link to="/perception/queries" class="nav-item">
              <el-icon><Search /></el-icon>
              <span>查询管理</span>
            </router-link>
          </li>
          <li>
            <router-link to="/evolution/dashboard" class="nav-item">
              <el-icon><TrendCharts /></el-icon>
              <span>进化大屏</span>
            </router-link>
          </li>
          <li>
            <router-link to="/evolution/strategies" class="nav-item">
              <el-icon><List /></el-icon>
              <span>策略管理</span>
            </router-link>
          </li>
          <li>
            <router-link to="/generation/dashboard" class="nav-item">
              <el-icon><Document /></el-icon>
              <span>生成大屏</span>
            </router-link>
          </li>
          <li>
            <router-link to="/generation/contents" class="nav-item">
              <el-icon><Files /></el-icon>
              <span>内容管理</span>
            </router-link>
          </li>
          <li>
            <router-link to="/memory/management" class="nav-item">
              <el-icon><Collection /></el-icon>
              <span>记忆管理</span>
            </router-link>
          </li>
          <li>
            <router-link to="/execution/dashboard" class="nav-item">
              <el-icon><Operation /></el-icon>
              <span>执行大屏</span>
            </router-link>
          </li>
          <li>
            <router-link to="/compliance/management" class="nav-item">
              <el-icon><Warning /></el-icon>
              <span>合规检测</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="user-info">
          <span>欢迎使用 Evogeo 系统</span>
        </div>
      </header>
      
      <!-- 路由视图 -->
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { DataAnalysis, Search, TrendCharts, List, Document, Files, Collection, Operation, Warning } from '@element-plus/icons-vue'
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background-color: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.logo {
  padding: 0 20px 30px;
  border-bottom: 1px solid #2a2a4e;
}

.logo h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 5px;
  color: #409eff;
}

.logo p {
  font-size: 12px;
  color: #8a8aa3;
  margin: 0;
}

.navigation {
  flex: 1;
  padding: 20px 0;
}

.navigation ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #8a8aa3;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  color: #fff;
  background-color: rgba(64, 158, 255, 0.1);
  border-left-color: #409eff;
}

.nav-item.router-link-active {
  color: #fff;
  background-color: rgba(64, 158, 255, 0.2);
  border-left-color: #409eff;
}

.nav-item :deep(el-icon) {
  margin-right: 10px;
  font-size: 18px;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  overflow: hidden;
}

.top-bar {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  font-size: 14px;
  color: #666;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .logo h1,
  .logo p,
  .nav-item span {
    display: none;
  }
  
  .nav-item {
    justify-content: center;
    padding: 12px 0;
  }
  
  .nav-item :deep(el-icon) {
    margin-right: 0;
  }
}
</style>