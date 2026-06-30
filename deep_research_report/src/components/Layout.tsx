import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabItems = [
    { path: '/', label: '新建', icon: 'search' },
    { path: '/reports', label: '报告', icon: 'file' },
    { path: '/knowledge', label: '知识库', icon: 'book' },
  ];

  return (
    <div className="app-layout">
      <header className="appbar">
        <div className="appbar-brand">
          <div className="appbar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className="appbar-title">Agent Forge</span>
          <div className="appbar-divider" />
          <span className="appbar-subtitle">行业深度研究报告 Agent</span>
        </div>
      </header>

      <Sidebar />

      <nav className="tabbar" aria-label="移动端导航">
        <div className="tabbar-inner">
          {tabItems.map((t) => (
            <div
              key={t.path}
              className={'tabbar-item' + (location.pathname === t.path ? ' active' : '')}
              onClick={() => navigate(t.path)}
              role="button"
              tabIndex={0}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {t.icon === 'search' && <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>}
                {t.icon === 'file' && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                {t.icon === 'book' && <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>}
              </svg>
              {t.label}
            </div>
          ))}
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
