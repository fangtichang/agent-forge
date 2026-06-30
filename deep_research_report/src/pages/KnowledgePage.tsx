import { useState, useEffect } from 'react';
import { KnowledgeApiService } from '@/services/knowledgeApi';
import type { KnowledgeDoc } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  ready: '已索引', processing: '处理中', error: '索引失败', uploading: '上传中',
};

const STATUS_CLASS: Record<string, string> = {
  ready: 'badge-status-completed', processing: 'badge-status-generating', error: 'badge-status-failed', uploading: 'badge-status-draft',
};

interface EndpointDef {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  desc: string;
}

const ENDPOINTS: Record<string, EndpointDef[]> = {
  reports: [
    { method: 'GET', path: '/api/v1/reports', desc: '获取报告列表，支持分页与状态筛选' },
    { method: 'POST', path: '/api/v1/reports', desc: '创建新的深度研究报告' },
    { method: 'GET', path: '/api/v1/reports/:id', desc: '获取指定报告的详细内容' },
    { method: 'DELETE', path: '/api/v1/reports/:id', desc: '删除指定报告及其关联数据' },
  ],
  knowledge: [
    { method: 'GET', path: '/api/v1/knowledge/documents', desc: '获取知识库文档列表' },
    { method: 'POST', path: '/api/v1/knowledge/documents', desc: '上传文档至知识库' },
    { method: 'GET', path: '/api/v1/knowledge/documents/:id', desc: '获取指定文档详情与索引状态' },
    { method: 'DELETE', path: '/api/v1/knowledge/documents/:id', desc: '从知识库中移除指定文档' },
  ],
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [apiOpen, setApiOpen] = useState(false);
  const [apiTab, setApiTab] = useState('reports');

  useEffect(() => {
    KnowledgeApiService.listDocuments().then((res) => setDocs(res.documents));
  }, []);

  const currentEndpoints = ENDPOINTS[apiTab] || [];

  return (
    <div>
      <div className="kb-header">
        <div className="kb-header-left">
          <h1>知识库</h1>
          <p>管理文档与数据源，为深度研究提供知识基础</p>
        </div>
        <button className="btn btn-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          上传文档
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>文档名称</th>
              <th>来源</th>
              <th>状态</th>
              <th className="col-words">字数</th>
              <th className="col-date">更新日期</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-gray-500)', padding: 'var(--space-8)' }}>加载中...</td></tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id}>
                  <td><span style={{ fontWeight: 500, color: 'var(--color-gray-800)' }}>{doc.title}</span></td>
                  <td><code>{doc.source === 'url' ? 'GET /api/v1/knowledge/documents' : 'POST /api/v1/knowledge/documents'}</code></td>
                  <td><span className={'badge ' + (STATUS_CLASS[doc.status] || 'badge-default')}>{STATUS_LABELS[doc.status] || doc.status}</span></td>
                  <td className="col-words">{doc.wordCount ? doc.wordCount.toLocaleString() : '—'}</td>
                  <td className="col-date">{doc.createdAt.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {docs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <div className="empty-state-title">知识库为空</div>
          <div className="empty-state-desc">上传文档或添加 API 数据源，为深度研究提供知识基础。</div>
        </div>
      )}

      <div className={'api-panel' + (apiOpen ? ' open' : '')}>
        <div className="api-panel-header" onClick={() => setApiOpen(!apiOpen)} role="button" tabIndex={0} aria-expanded={apiOpen}>
          <div className="api-panel-header-left">
            <h3>API 接口参考</h3>
            <span className="api-panel-badge">8 个端点</span>
          </div>
          <svg className="api-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div className="api-panel-body">
          <div className="api-tabs">
            {['reports', 'knowledge'].map((tab) => (
              <div key={tab} className={'api-tab' + (apiTab === tab ? ' active' : '')} onClick={() => setApiTab(tab)}>
                {tab === 'reports' ? 'Reports API' : 'Knowledge API'}
              </div>
            ))}
          </div>
          <div className="api-endpoints">
            {currentEndpoints.map((ep, i) => (
              <div key={i} className="api-endpoint">
                <span className={'api-method ' + ep.method.toLowerCase()}>{ep.method === 'DELETE' ? 'DEL' : ep.method}</span>
                <span className="api-path">{ep.path}</span>
                <span className="api-desc">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
