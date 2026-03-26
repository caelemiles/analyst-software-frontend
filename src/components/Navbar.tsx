import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
    }`;

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-white font-bold text-xl">
              ⚽ EFL Scout
            </Link>
            <div className="hidden sm:flex space-x-2">
              <Link to="/" className={linkClass('/')}>
                Dashboard
              </Link>
              <Link to="/portfolio" className={linkClass('/portfolio')}>
                Portfolio
              </Link>
            </div>
          </div>
          <div className="sm:hidden flex space-x-2">
            <Link to="/" className={linkClass('/')}>
              Dashboard
            </Link>
            <Link to="/portfolio" className={linkClass('/portfolio')}>
              Portfolio
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
