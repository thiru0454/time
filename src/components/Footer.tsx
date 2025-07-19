import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, GithubLogo, TwitterLogo, LinkedinLogo } from 'phosphor-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white/80 dark:bg-zinc-900/80 border-t border-gray-100 dark:border-zinc-800 backdrop-blur-md mt-12">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo/Title */}
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <GraduationCap size={28} className="text-blue-700 dark:text-blue-300" />
          <span className="font-bold text-lg text-blue-700 dark:text-blue-300 tracking-tight">UniDash</span>
        </div>
        {/* Quick Links */}
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">About</Link>
          <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Contact</Link>
          <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Privacy</Link>
        </div>
        {/* Socials */}
        <div className="flex gap-3">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
            <GithubLogo size={22} weight="duotone" />
          </a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
            <TwitterLogo size={22} weight="duotone" />
          </a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
            <LinkedinLogo size={22} weight="duotone" />
          </a>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
        &copy; {new Date().getFullYear()} UniDash. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 