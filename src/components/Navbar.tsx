import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { List, X, UserCircle, Sun, Moon } from 'phosphor-react';
// Google Fonts: Inter (add to index.html for production)
import '@fontsource/inter/index.css';

const navLinks = [
  { name: 'Dashboard', to: '/' },
  { name: 'Timetables', to: '/timetable-management' },
  { name: 'Faculty', to: '/faculty' },
  { name: 'Students', to: '/students' },
];

function setFontFamily() {
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontFamily = 'Inter, system-ui, sans-serif';
  }
}
setFontFamily();

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  React.useEffect(() => {
    // On mount, sync with system or localStorage
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }
  }, []);

  return (
    <nav className="w-full bg-white/80 dark:bg-zinc-900/80 border-b border-gray-100 dark:border-zinc-800 backdrop-blur-md sticky top-0 z-40 font-sans">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo/Title */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-700 dark:text-blue-300 tracking-tight">
          <span className="inline-block w-7 h-7 bg-blue-600 rounded-md mr-1" />
          UniDash
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.to}
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded transition-colors font-medium"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* User/Profile & Theme Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {dark ? (
              <Sun size={22} className="text-yellow-400" />
            ) : (
              <Moon size={22} className="text-blue-700" />
            )}
          </button>
          <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition">
            <UserCircle size={28} className="text-blue-700 dark:text-blue-300" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Profile</span>
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <List size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-zinc-900/95 border-t border-gray-100 dark:border-zinc-800 px-4 pb-4 pt-2 animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.to}
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-2 rounded transition-colors font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={toggleDark}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {dark ? (
                  <Sun size={22} className="text-yellow-400" />
                ) : (
                  <Moon size={22} className="text-blue-700" />
                )}
              </button>
              <button className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition">
                <UserCircle size={24} className="text-blue-700 dark:text-blue-300" />
                <span className="text-gray-700 dark:text-gray-200 font-medium">Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 