import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReport } from '@/hooks/useReport';

const EXAMPLE_TOPICS = [
  '人工智能芯片市场格局分析',
  '全球新能源汽车产业研究',
  '量子计算商业化前景',
  'Web3与去中心化金融趋势',
];

const DEPTHS = [
  { id: 'quick', label: '快速', meta: '~3 min' },
  { id: 'standard', label: '标准', meta: '~8 min' },
  { id: 'deep', label: '深度', meta: '~20 min' },
];

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState('standard');
  const [error, setError] = useState('');
  const { startReport } = useReport();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!topic.trim()) {
      setError('请输入研究话题');
      return;
    }
    setError('');
    startReport(topic.trim());
    navigate('/progress');
  };

  return (
    <div className="view-new-research">
      <div className="research-card">
        <h1 className="research-title">开始新的研究</h1>
        <p className="research-desc">输入行业或话题关键词，AI 将自动生成结构化的深度分析报告，附引用溯源与交互式追问。</p>

        <div className="research-field">
          <label className="research-label">研究话题</label>
          <input
            className="input"
            placeholder="输入你想研究的话题..."
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={error ? { borderColor: 'var(--color-error)' } : {}}
          />
          {error && <span style={{ fontSize: 'var(--font-caption)', color: 'var(--color-error)', marginTop: 'var(--space-1)', display: 'block' }}>{error}</span>}
        </div>

        <div className="research-field">
          <label className="research-label">研究深度</label>
          <div className="depth-group" role="radiogroup">
            {DEPTHS.map((d) => (
              <button
                key={d.id}
                className={'depth-btn' + (depth === d.id ? ' selected' : '')}
                role="radio"
                aria-checked={depth === d.id}
                onClick={() => setDepth(d.id)}
              >
                {d.label} ({d.meta})
              </button>
            ))}
          </div>
        </div>

        <hr className="divider-ornament" />

        <div className="research-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            开始研究
          </button>
        </div>

        <div className="topics-label">示例话题</div>
        <div className="topics-row">
          {EXAMPLE_TOPICS.map((t) => (
            <div key={t} className="chip" onClick={() => { setTopic(t); setError(''); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 4, opacity: 0.5 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
