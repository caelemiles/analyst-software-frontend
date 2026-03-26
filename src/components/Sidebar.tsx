import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Players', icon: '👤', path: '/' },
  { label: 'Stats Table', icon: '📈', path: '/stats' },
  { label: 'Teams', icon: '🏟️', path: '/teams' },
  { label: 'Leagues', icon: '🏆', path: '/leagues' },
  { label: 'Portfolio', icon: '📋', path: '/portfolio' },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string, label: string) => {
    if (label === 'Players') return location.pathname === '/' || location.pathname.startsWith('/player');
    if (label === 'Dashboard') return location.pathname === '/';
    return location.pathname === path;
  };

  const linkClasses = (path: string, label: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path, label)
        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
    }`;

  const navContent = (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700/50">
        <Link
          to="/"
          className="text-white font-bold text-xl flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-2xl">⚽</span>
          {!collapsed && <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Pro Analyst</span>}
        </Link>
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden md:inline-flex text-slate-500 hover:text-white transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={linkClasses(item.path, item.label)}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Season badge */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-slate-700/50">
          <div className="px-3 py-2 rounded-lg bg-slate-800/50 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Season</p>
            <p className="text-sm font-semibold text-indigo-400">2025/26</p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center h-14 bg-slate-900 px-4 md:hidden border-b border-slate-800">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white text-2xl mr-3"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="text-white font-bold text-lg">⚽ Pro Analyst</span>
      </div>

      {/* Mobile spacer */}
      <div className="h-14 md:hidden shrink-0" />

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-slate-900 border-r border-slate-800 flex flex-col
          transition-transform duration-200
          md:sticky md:top-0 md:translate-x-0 md:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          ✕
        </button>

        {navContent}
      </aside>
    </>
  );
}
