 import type { KnowledgeDoc, CreateKnowledgeDocRequest } from '@/types';
 
 const MOCK_DOCS: KnowledgeDoc[] = [
   { id: 'kd_1', title: 'Q4 全球半导体市场报告', source: 'file', tags: ['半导体', '市场'], status: 'ready', wordCount: 12000, createdAt: '2025-12-10T08:00:00Z', updatedAt: '2025-12-10T08:00:00Z' },
   { id: 'kd_2', title: '动力电池技术路线对比白皮书', source: 'file', tags: ['电池', '技术'], status: 'ready', wordCount: 8500, createdAt: '2025-12-08T10:30:00Z', updatedAt: '2025-12-08T10:30:00Z' },
   { id: 'kd_3', title: '2025消费电子CES亮点汇总', source: 'url', tags: ['消费电子', 'CES'], status: 'processing', createdAt: '2025-12-19T14:00:00Z', updatedAt: '2025-12-19T14:00:00Z' },
   { id: 'kd_4', title: '自动驾驶法规政策汇编', source: 'file', tags: ['自动驾驶', '法规'], status: 'ready', wordCount: 15000, createdAt: '2025-12-05T09:00:00Z', updatedAt: '2025-12-05T09:00:00Z' },
   { id: 'kd_5', title: '新能源补贴政策变化跟踪', source: 'url', tags: ['新能源', '政策'], status: 'error', createdAt: '2025-12-01T11:00:00Z', updatedAt: '2025-12-01T11:00:00Z' },
 ];
 
 export class KnowledgeApiService {
   static async listDocuments(): Promise<{ documents: KnowledgeDoc[]; total: number }> {
     await new Promise(r => setTimeout(r, 300));
     return { documents: [...MOCK_DOCS], total: MOCK_DOCS.length };
   }
 
   static async getDocument(id: string): Promise<KnowledgeDoc | null> {
     await new Promise(r => setTimeout(r, 200));
     return MOCK_DOCS.find(d => d.id === id) || null;
   }
 
   static async createDocument(req: CreateKnowledgeDocRequest): Promise<KnowledgeDoc> {
     await new Promise(r => setTimeout(r, 500));
     const doc: KnowledgeDoc = {
       id: `kd_${Date.now()}`,
       title: req.title,
       source: req.source,
       tags: req.tags || [],
       status: 'processing',
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };
     MOCK_DOCS.unshift(doc);
     return doc;
   }
 
   static async deleteDocument(id: string): Promise<boolean> {
     await new Promise(r => setTimeout(r, 200));
     const idx = MOCK_DOCS.findIndex(d => d.id === id);
     if (idx === -1) return false;
     MOCK_DOCS.splice(idx, 1);
     return true;
   }
 }
