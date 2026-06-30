import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_REPORTS = [
  { id: 'r1', topic: 'AI芯片市场格局分析', status: 'completed', createdAt: '2026-06-28', depth: '深度' },
  { id: 'r2', topic: '全球新能源汽车产业研究', status: 'completed', createdAt: '2026-06-25', depth: '标准' },
  { id: 'r3', topic: '元宇宙技术栈投资机会', status: 'generating', createdAt: '2026-06-29', depth: '深度' },
  { id: 'r4', topic: '量子计算商业化前景', status: 'failed', createdAt: '2026-06-20', depth: '快速' },
];

const STATUS_LABELS: Record<string, string> = {
  completed: '已完成', generating: '生成中', failed: '失败', draft: '草稿',
};

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'generating', label: '生成中' },
  { id: 'completed', label: '已完成' },
  { id: 'failed', label: '失败' },
];

export default function ReportsListPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = MOCK_REPORTS.filter((r) => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search || r.topic.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div className="reports-header">
        <div className="reports-header-left">
          <h1>研究报告</h1>
          <p>管理已生成的研究报告</p>
        </div>
        <div className="reports-header-right">
          <div className="search-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="input" placeholder="搜索报告..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {FILTERS.map((f) => (
          <div key={f.id} className={'filter-tab' + (filter === f.id ? ' active' : '')} onClick={() => setFilter(f.id)}>{f.label}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="empty-state-title">暂无报告</div>
          <div className="empty-state-desc">还没有生成任何研究报告，去创建一个吧。</div>
        </div>
      ) : (
        <div className="reports-grid">
          {filtered.map((report) => (
            <div key={report.id} className="card report-card" onClick={() => report.status === 'completed' && navigate('/report/' + report.id)}>
              <div className="report-card-header">
                <div className="report-card-title">{report.topic}</div>
                <span className={'badge badge-status-' + report.status}>{STATUS_LABELS[report.status]}</span>
              </div>
              <div className="report-card-meta">
                <span className="report-card-date">{report.createdAt}</span>
                <span className="badge badge-default" style={{ height: 20, fontSize: 'var(--text-small)' }}>{report.depth}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
