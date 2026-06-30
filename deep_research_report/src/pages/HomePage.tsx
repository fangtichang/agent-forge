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
    <div className="new-research-wrapper">
      <div className="card new-research-card">
        <div className="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className="new-research-title">开始新的研究</h1>
        <p className="new-research-desc">输入行业或话题关键词，AI 将自动生成结构化深度分析报告</p>

        <div className="new-research-field">
          <label>研究话题</label>
          <div className="topic-input-wrapper">
            <input
              className={'input input-lg' + (error ? ' input-error' : '')}
              placeholder="输入你想研究的话题..."
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {error && <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-error)', marginTop: 'var(--space-1)', display: 'block' }}>{error}</span>}
          </div>
        </div>

        <div className="new-research-field">
          <label>研究深度</label>
          <div className="capsule-group" role="radiogroup">
            {DEPTHS.map((d) => (
              <div
                key={d.id}
                className={'capsule-option' + (depth === d.id ? ' active' : '')}
                role="radio"
                aria-checked={depth === d.id}
                onClick={() => setDepth(d.id)}
              >
                {d.label}
                <span className="capsule-option-meta">{d.meta}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="new-research-actions">
          <button className="btn btn-accent-gradient btn-research" onClick={handleSubmit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            开始研究
          </button>
        </div>

        <div className="example-chips">
          <div className="example-chips-label">示例话题</div>
          <div className="example-chips-row">
            {EXAMPLE_TOPICS.map((t) => (
              <div key={t} className="chip" onClick={() => { setTopic(t); setError(''); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
