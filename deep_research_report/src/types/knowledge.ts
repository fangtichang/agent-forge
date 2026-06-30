 export interface KnowledgeDoc {
   id: string;
   title: string;
   source: 'url' | 'file' | 'text';
   content?: string;
   tags: string[];
   status: 'uploading' | 'processing' | 'ready' | 'error';
   wordCount?: number;
   createdAt: string;
   updatedAt: string;
 }
 
 export interface CreateKnowledgeDocRequest {
   title: string;
   source: 'url' | 'file' | 'text';
   content?: string;
   tags?: string[];
 }
