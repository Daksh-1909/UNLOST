import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, Search, PlusCircle, Shield, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Search },
    { name: 'Items', href: '/items', icon: Search },
    { name: 'Report Item', href: '/report', icon: PlusCircle },
    { name: 'Contact', href: '/contact', icon: Phone },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  if (user?.is_admin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight font-heading">
                UNLOST
              </span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                  isActive(item.href)
                    ? 'text-white bg-slate-800/80 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-slate-800/80 rounded-lg -z-10 border border-white/5"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="h-6 w-px bg-slate-800 mx-2"></div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-slate-400 border border-slate-800 rounded-full px-3 py-1 bg-slate-950/40">
                {user?.username}
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 transition-all duration-200"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-850 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-slate-950/95"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-all ${
                    isActive(item.href)
                      ? 'text-white bg-slate-800 shadow-inner'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="border-t border-slate-900 my-2 pt-2 px-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">{user?.username}</span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="flex items-center space-x-1 text-sm font-semibold text-rose-400 hover:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
