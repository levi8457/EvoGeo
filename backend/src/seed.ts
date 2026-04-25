import { DataSource } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { MonitoringQuery } from './entities/monitoring-query.entity';
import { AiPlatform } from './entities/ai-platform.entity';
import { MemoryEntry } from './entities/memory-entry.entity';
import { GeneratedContent } from './entities/generated-content.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'evogeo.db',
  entities: [Brand, MonitoringQuery, AiPlatform, MemoryEntry, GeneratedContent],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const brandRepo = AppDataSource.getRepository(Brand);
  const queryRepo = AppDataSource.getRepository(MonitoringQuery);
  const platformRepo = AppDataSource.getRepository(AiPlatform);
  const memoryRepo = AppDataSource.getRepository(MemoryEntry);
  const contentRepo = AppDataSource.getRepository(GeneratedContent);

  // Clear existing data
  await contentRepo.delete({});
  await memoryRepo.delete({});
  await queryRepo.delete({});
  await platformRepo.delete({});
  await brandRepo.delete({});

  // Create 2 brands
  const brand1 = await brandRepo.save(brandRepo.create({
    name: '科技前沿',
    description: '科技行业前沿资讯与产品评测',
    industry: 'technology',
  }));

  const brand2 = await brandRepo.save(brandRepo.create({
    name: '生活方式',
    description: '都市生活美学与品质提升',
    industry: 'lifestyle',
  }));

  console.log('Created 2 brands');

  // Create 3-5 monitoring queries per brand
  const queries1 = [
    { brandId: brand1.id, queryText: '人工智能最新进展', category: 'technology', priority: 9 },
    { brandId: brand1.id, queryText: '智能手机评测', category: 'product', priority: 8 },
    { brandId: brand1.id, queryText: '新能源汽车市场', category: 'industry', priority: 7 },
    { brandId: brand1.id, queryText: '芯片技术发展', category: 'technology', priority: 9 },
  ];

  const queries2 = [
    { brandId: brand2.id, queryText: '健康饮食趋势', category: 'health', priority: 8 },
    { brandId: brand2.id, queryText: '家居装修灵感', category: 'home', priority: 7 },
    { brandId: brand2.id, queryText: '健身运动方式', category: 'fitness', priority: 9 },
    { brandId: brand2.id, queryText: '旅行目的地推荐', category: 'travel', priority: 6 },
    { brandId: brand2.id, queryText: '职场减压技巧', category: 'work', priority: 7 },
  ];

  for (const q of queries1) {
    await queryRepo.save(queryRepo.create(q));
  }
  for (const q of queries2) {
    await queryRepo.save(queryRepo.create(q));
  }

  console.log('Created 9 monitoring queries (4+5)');

  // Create 7 AI platforms
  const platforms = [
    { name: 'DeepSeek', apiEndpoint: 'https://api.deepseek.com/v1', apiKey: 'mock-key-deepseek-123', model: 'deepseek-chat', isActive: true },
    { name: 'ChatGPT', apiEndpoint: 'https://api.openai.com/v1', apiKey: 'mock-key-openai-456', model: 'gpt-4', isActive: true },
    { name: 'Kimi', apiEndpoint: 'https://api.moonshot.cn/v1', apiKey: 'mock-key-kimi-789', model: 'kimi-chat', isActive: true },
    { name: '文心一言', apiEndpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1', apiKey: 'mock-key-wenxin-101', model: 'ernie-4', isActive: true },
    { name: '通义千问', apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1', apiKey: 'mock-key-tongyi-202', model: 'qwen-turbo', isActive: true },
    { name: 'Claude', apiEndpoint: 'https://api.anthropic.com/v1', apiKey: 'mock-key-claude-303', model: 'claude-3-opus', isActive: true },
    { name: 'Gemini', apiEndpoint: 'https://generativelanguage.googleapis.com/v1', apiKey: 'mock-key-gemini-404', model: 'gemini-pro', isActive: true },
  ];

  for (const p of platforms) {
    await platformRepo.save(platformRepo.create(p));
  }

  console.log('Created 7 AI platforms');

  // Create 10+ memory entries
  const memories = [
    { brandId: brand1.id, memoryType: 'brand_tone', memoryKey: 'tech_authoritative', content: '保持专业权威的技术分析风格，语言简洁准确', importance: 9 },
    { brandId: brand1.id, memoryType: 'content_rule', memoryKey: 'no_hype', content: '避免夸大宣传，只引用真实数据和权威来源', importance: 8 },
    { brandId: brand1.id, memoryType: 'audience_pref', memoryKey: 'tech_enthusiasts', content: '读者多为科技爱好者和从业者，喜欢深度技术分析', importance: 7 },
    { brandId: brand1.id, memoryType: 'trend_insight', memoryKey: 'ai_focus_2024', content: '2024年AI和大模型是核心话题，密切关注', importance: 9 },
    { brandId: brand1.id, memoryType: 'brand_tone', memoryKey: 'innovation_oriented', content: '重点关注创新性产品和技术突破', importance: 8 },
    { brandId: brand2.id, memoryType: 'brand_tone', memoryKey: 'warm_lifestyle', content: '温暖亲切的生活方式内容，贴近大众需求', importance: 8 },
    { brandId: brand2.id, memoryType: 'content_rule', memoryKey: 'health_safety', content: '健康相关内容需确保信息准确安全', importance: 9 },
    { brandId: brand2.id, memoryType: 'audience_pref', memoryKey: 'urban_young', content: '主要受众为都市年轻人，追求品质生活', importance: 7 },
    { brandId: brand2.id, memoryType: 'trend_insight', memoryKey: 'wellness_2024', content: '2024年健康养生和心理健康关注度上升', importance: 8 },
    { brandId: brand2.id, memoryType: 'brand_tone', memoryKey: 'practical_tips', content: '提供实用性强的生活技巧和建议', importance: 8 },
    { brandId: brand2.id, memoryType: 'content_rule', memoryKey: 'visual_appeal', content: '内容配合高质量图片效果更佳', importance: 6 },
    { brandId: brand1.id, memoryType: 'audience_pref', memoryKey: 'budget_conscious', content: '读者关注性价比，产品评测需包含价格分析', importance: 7 },
  ];

  for (const m of memories) {
    await memoryRepo.save(memoryRepo.create(m));
  }

  console.log('Created 12 memory entries');

  // Create some generated content for testing deploy/archive
  const contents = [
    { brandId: brand1.id, contentType: 'article', contentTitle: 'AI大模型发展趋势分析', content: '随着技术的发展，AI大模型正在改变各个行业...', platform: 'deepseek', status: 'published', deploymentStatus: 'deployed' },
    { brandId: brand1.id, contentType: 'social_media', contentTitle: '新品发布预告', content: '最新旗舰手机即将发布，更多详情请关注...', platform: 'chatgpt', status: 'published', deploymentStatus: 'draft' },
    { brandId: brand2.id, contentType: 'blog', contentTitle: '春季养生指南', content: '春天是养生的好时节，以下是几点建议...', platform: 'kimi', status: 'published', deploymentStatus: 'deployed' },
  ];

  for (const c of contents) {
    await contentRepo.save(contentRepo.create(c));
  }

  console.log('Created 3 generated content entries');
  console.log('Seed completed successfully!');

  await AppDataSource.destroy();
}

seed().catch(console.error);
