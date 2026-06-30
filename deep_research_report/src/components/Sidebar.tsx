import { useLocation, useNavigate } from 'react-router-dom';

const PRIMARY_NAV = [
  { path: '/', label: '新建研究', icon: 'search', view: 'new-research' },
  { path: '/reports', label: '研究报告', icon: 'file', view: 'reports' },
  { path: '/knowledge', label: '知识库', icon: 'book', view: 'knowledge' },
];

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'file':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-group-label">导航</div>
      {PRIMARY_NAV.map((item) => (
        <div
          key={item.path}
          className={'nav-item' + (location.pathname === item.path ? ' active' : '')}
          data-view={item.view}
          onClick={() => navigate(item.path)}
          role="button"
          tabIndex={0}
        >
          <span className="nav-icon"><NavIcon name={item.icon} /></span>
          <span>{item.label}</span>
        </div>
      ))}

      <div className="sidebar-group-label">其他</div>
      <div className="nav-item" data-view="settings" role="button" tabIndex={0}>
        <span className="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </span>
        <span>设置</span>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-text">agent-forge v1.0<br/>AI 驱动的深度研究</div>
      </div>
    </aside>
  );
}
