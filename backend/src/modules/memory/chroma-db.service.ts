import { Injectable, Logger } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';

@Injectable()
export class ChromaDbService {
  private readonly logger = new Logger(ChromaDbService.name);
  private client: ChromaClient;
  private collections: Map<string, Collection> = new Map();

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = new ChromaClient({
        path: process.env.CHROMADB_URL || 'http://localhost:8000',
      });
      this.logger.log('ChromaDB客户端初始化成功');
    } catch (error) {
      this.logger.error('ChromaDB客户端初始化失败:', error);
      // 即使初始化失败，服务也能正常运行，只是向量搜索功能会被禁用
    }
  }

  private async getOrCreateCollection(collectionName: string): Promise<Collection | null> {
    if (!this.client) {
      return null;
    }

    try {
      if (!this.collections.has(collectionName)) {
        const collection = await this.client.getOrCreateCollection({
          name: collectionName,
          metadata: { createdBy: 'EvoGEO' },
        });
        this.collections.set(collectionName, collection);
      }
      return this.collections.get(collectionName) || null;
    } catch (error) {
      this.logger.error(`获取或创建集合失败 [${collectionName}]:`, error);
      return null;
    }
  }

  async addDocument(
    collectionName: string,
    id: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) {
        return false;
      }

      await collection.add({
        ids: [id],
        documents: [content],
        metadatas: metadata ? [metadata] : undefined,
      });
      return true;
    } catch (error) {
      this.logger.error('添加文档到ChromaDB失败:', error);
      return false;
    }
  }

  async updateDocument(
    collectionName: string,
    id: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) {
        return false;
      }

      await collection.update({
        ids: [id],
        documents: [content],
        metadatas: metadata ? [metadata] : undefined,
      });
      return true;
    } catch (error) {
      this.logger.error('更新ChromaDB文档失败:', error);
      return false;
    }
  }

  async deleteDocument(collectionName: string, id: string): Promise<boolean> {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) {
        return false;
      }

      await collection.delete({
        ids: [id],
      });
      return true;
    } catch (error) {
      this.logger.error('删除ChromaDB文档失败:', error);
      return false;
    }
  }

  async querySimilar(
    collectionName: string,
    query: string,
    limit: number = 5,
    filter?: Record<string, any>,
  ): Promise<Array<{ id: string; score: number; metadata?: any }>> {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) {
        return [];
      }

      const result = await collection.query({
        queryTexts: [query],
        nResults: limit,
        where: filter,
      });

      const similarities: Array<{ id: string; score: number; metadata?: any }> = [];
      if (result.ids[0] && result.ids[0].length > 0) {
        for (let i = 0; i < result.ids[0].length; i++) {
          similarities.push({
            id: result.ids[0][i],
            score: result.distances ? Number(result.distances[0][i]) : 0,
            metadata: result.metadatas ? result.metadatas[0][i] : undefined,
          });
        }
      }

      return similarities;
    } catch (error) {
      this.logger.error('ChromaDB相似性查询失败:', error);
      return [];
    }
  }

  async getCollectionStats(collectionName: string): Promise<{ count: number } | null> {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) {
        return null;
      }

      const result = await collection.count();
      return { count: result };
    } catch (error) {
      this.logger.error('获取ChromaDB集合统计失败:', error);
      return null;
    }
  }

  async resetCollection(collectionName: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.deleteCollection({ name: collectionName });
      this.collections.delete(collectionName);
      return true;
    } catch (error) {
      this.logger.error(`重置集合失败 [${collectionName}]:`, error);
      return false;
    }
  }
}
