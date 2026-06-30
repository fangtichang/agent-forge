import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_REPORTS = [
  { id: 'r1', topic: 'AI芯片市场格局分析', status: 'completed', createdAt: '2026-06-28', depth: '深度', excerpt: '对全球AI芯片市场的全面分析，涵盖NVIDIA、AMD、Intel等主要玩家的市场份额与竞争格局。' },
  { id: 'r2', topic: '全球新能源汽车产业研究', status: 'completed', createdAt: '2026-06-25', depth: '标准', excerpt: '从市场概况、技术路线、政策环境三个维度剖析全球新能源汽车产业的发展态势。' },
  { id: 'r3', topic: '元宇宙技术栈投资机会', status: 'generating', createdAt: '2026-06-29', depth: '深度', excerpt: '分析元宇宙底层技术栈的投资价值，涵盖基础设施、引擎平台、应用生态三层架构。' },
  { id: 'r4', topic: '量子计算商业化前景', status: 'failed', createdAt: '2026-06-20', depth: '快速', excerpt: '评估量子计算从科研到商用的时间线与关键里程碑，识别主要技术障碍。' },
];

const STATUS_LABELS: Record<string, string> = { completed: '已完成', generating: '生成中', failed: '失败' };
const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'completed', label: '已完成' },
  { id: 'generating', label: '生成中' },
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
      <div className="view-reports-header">
        <h1 className="view-title">研究报告</h1>
        <div className="view-reports-toolbar">
          <div className="search-input-wrap">
            <span className="search-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input className="input" placeholder="搜索报告..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="filter-pills" style={{ marginBottom: 'var(--space-6)' }}>
        {FILTERS.map((f) => (
          <button key={f.id} className={'filter-pill' + (filter === f.id ? ' active' : '')} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={'empty-state' + (true ? ' visible' : '')}>
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="empty-state-title">暂无报告</div>
          <div className="empty-state-desc">还没有生成任何研究报告，去创建一个吧。</div>
        </div>
      ) : (
        <div className="reports-grid">
          {filtered.map((report) => (
            <div key={report.id} className="report-card" onClick={() => report.status === 'completed' && navigate('/report/' + report.id)}>
              <div className="report-card-title">{report.topic}</div>
              <div className="report-card-meta">
                <span className={'badge ' + (report.status === 'completed' ? 'badge-success' : report.status === 'generating' ? 'badge-warning' : 'badge-error')}>
                  {report.status === 'completed' ? <><span className="badge-dot" />已完成</> : report.status === 'generating' ? '生成中' : '失败'}
                </span>
                <span className="report-card-date">{report.createdAt}</span>
              </div>
              <div className="report-card-excerpt">{report.excerpt}</div>
              <div className="report-card-footer">
                <span className="badge badge-neutral">{report.depth}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
