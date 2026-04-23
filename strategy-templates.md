# 策略管理模板

## 1. 策略基本结构

### 策略类型
- **content_optimization** - 内容优化策略
- **platform_adaptation** - 平台适配策略
- **time_optimization** - 时间优化策略
- **keyword_targeting** - 关键词 targeting 策略
- **competitor_analysis** - 竞品分析策略

### 策略参数结构
```json
{
  "targetLength": 500,          // 目标内容长度
  "includeKeywords": true,      // 是否包含关键词
  "optimizationLevel": "high",  // 优化级别 (low/medium/high)
  "priorityKeywords": [],       // 优先关键词列表
  "platforms": [],              // 目标平台列表
  "adaptationLevel": "medium", // 适配级别
  "maxLength": 800,            // 最大长度
  "formatOptions": [],          // 格式选项
  "targetHours": [],            // 目标小时
  "timeZone": "Asia/Shanghai", // 时区
  "weekdayPriority": [],        // 工作日优先级
  "minInterval": 4              // 最小间隔（小时）
}
```

## 2. 策略模板示例

### 2.1 内容优化策略
**策略类型**: content_optimization
**内容模板**:
```
针对{品牌名称}的内容优化策略，通过优化标题和摘要提高AI平台的提及率和排名
```
**策略参数**:
```json
{
  "targetLength": 500,
  "includeKeywords": true,
  "optimizationLevel": "high",
  "priorityKeywords": ["AI副班", "智能教学", "教育科技"],
  "formatOptions": ["structured", "bullet_points"]
}
```

### 2.2 平台适配策略
**策略类型**: platform_adaptation
**内容模板**:
```
根据{platform}平台特性调整{品牌名称}的内容格式和风格，提高平台推荐度
```
**策略参数**:
```json
{
  "platforms": ["deepseek", "openai", "kimi"],
  "adaptationLevel": "medium",
  "maxLength": 800,
  "formatOptions": ["bullet_points", "structured"]
}
```

### 2.3 时间优化策略
**策略类型**: time_optimization
**内容模板**:
```
分析用户活跃时间，在最佳时段发布{品牌名称}相关内容，提高曝光率
```
**策略参数**:
```json
{
  "targetHours": [9, 12, 18, 21],
  "timeZone": "Asia/Shanghai",
  "weekdayPriority": [1, 2, 3, 4, 5],
  "minInterval": 4
}
```

### 2.4 关键词 targeting 策略
**策略类型**: keyword_targeting
**内容模板**:
```
针对热门搜索词{keyword}进行{品牌名称}内容优化，提高搜索排名
```
**策略参数**:
```json
{
  "targetLength": 600,
  "includeKeywords": true,
  "optimizationLevel": "high",
  "priorityKeywords": ["AI辅助教学", "智能教育", "教育科技"],
  "formatOptions": ["structured", "headings"]
}
```

### 2.5 竞品分析策略
**策略类型**: competitor_analysis
**内容模板**:
```
分析{品牌名称}与竞品的差异，突出核心优势，提高市场竞争力
```
**策略参数**:
```json
{
  "targetLength": 700,
  "includeKeywords": true,
  "optimizationLevel": "medium",
  "priorityKeywords": ["AI副班", "竞品对比", "核心优势"],
  "formatOptions": ["comparison_table", "bullet_points"]
}
```

## 3. 策略管理最佳实践

### 3.1 策略创建
1. **明确目标** - 确定策略的具体目标和预期效果
2. **选择合适类型** - 根据需求选择最适合的策略类型
3. **填写详细模板** - 提供清晰的内容模板，包含必要的变量
4. **设置合理参数** - 根据实际情况设置策略参数

### 3.2 策略优化
1. **定期评估** - 定期评估策略效果，调整适应度分数
2. **进化优化** - 使用进化功能生成更好的策略变种
3. **存档管理** - 保留表现良好的策略到存档中
4. **持续改进** - 根据反馈不断优化策略参数

### 3.3 策略应用
1. **批量部署** - 同时应用多个策略到不同平台
2. **A/B测试** - 测试不同策略的效果
3. **监控效果** - 实时监控策略执行效果
4. **数据驱动** - 根据数据反馈调整策略

## 4. 策略评估指标

### 4.1 适应度分数
- **0.0-0.3** - 表现较差
- **0.3-0.6** - 表现一般
- **0.6-0.8** - 表现良好
- **0.8-1.0** - 表现优秀

### 4.2 成功指标
- **提及率** - 品牌在AI回答中被提及的频率
- **首位提及率** - 品牌在回答中被首先提及的比例
- **引用次数** - 品牌被引用的次数
- **平台覆盖** - 策略在多少平台上有效
- **响应时间** - 策略执行的响应速度

## 5. 策略案例库

### 案例1: 教育科技品牌
**品牌**: AI副班
**策略类型**: content_optimization
**内容模板**:
```
AI副班是一款智能辅助教学系统，为教师提供{功能}，帮助{目标}，提高教学效率。
```
**参数**:
```json
{
  "targetLength": 500,
  "includeKeywords": true,
  "optimizationLevel": "high",
  "priorityKeywords": ["AI副班", "智能教学", "教育科技", "教师助手"],
  "formatOptions": ["structured", "bullet_points"]
}
```

### 案例2: 电商品牌
**品牌**: 智能商城
**策略类型**: platform_adaptation
**内容模板**:
```
智能商城在{platform}平台上提供{服务}，为用户带来{价值}，成为{定位}。
```
**参数**:
```json
{
  "platforms": ["deepseek", "openai", "kimi"],
  "adaptationLevel": "high",
  "maxLength": 600,
  "formatOptions": ["bullet_points", "structured"]
}
```

### 案例3: 金融服务品牌
**品牌**: 智慧金融
**策略类型**: time_optimization
**内容模板**:
```
智慧金融在{time}为用户提供{服务}，帮助用户{目标}，实现{价值}。
```
**参数**:
```json
{
  "targetHours": [9, 10, 11, 15, 16, 17],
  "timeZone": "Asia/Shanghai",
  "weekdayPriority": [1, 2, 3, 4, 5],
  "minInterval": 2
}
```