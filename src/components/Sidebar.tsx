import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Players', icon: '👤', path: '/' },
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
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path, label)
        ? 'bg-indigo-500 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const navContent = (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        <Link
          to="/"
          className="text-white font-bold text-xl flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span>⚽</span>
          {!collapsed && <span>Pro Analyst</span>}
        </Link>
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden md:inline-flex text-slate-400 hover:text-white"
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
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center h-14 bg-slate-900 px-4 md:hidden">
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
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-slate-900 flex flex-col
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
