import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, Search, PlusCircle, Shield, User, Phone, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
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
    <nav className="sticky top-0 z-50 glass-panel border-b" style={{ borderBottomColor: 'rgba(92, 50, 30, 0.12)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-tight font-heading">
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
                className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'text-[#6D584A] hover:text-[#3A2417] hover:bg-secondary/5'
                }`}
              >
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="h-6 w-px bg-secondary/20 mx-2"></div>
            
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Avatar" className="h-9 w-9 rounded-full border border-primary/20 shadow-sm" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-primary/10 shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div className="px-4 py-3 border-b border-primary/5 bg-slate-50/50">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.username}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                        <Search className="mr-3 h-4 w-4 text-slate-400" /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                        <User className="mr-3 h-4 w-4 text-slate-400" /> Profile
                      </Link>
                      <button
                        onClick={() => { setIsDropdownOpen(false); logout(); }}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-rose-500" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-primary hover:bg-secondary/5 focus:outline-none"
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
            className="md:hidden border-t border-primary/10 bg-surface/95"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-bold transition-all ${
                    isActive(item.href)
                      ? 'text-white bg-primary shadow-sm'
                      : 'text-[#6D584A] hover:text-[#3A2417] hover:bg-secondary/5'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="border-t border-primary/10 my-2 pt-2 px-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#6D584A]">{user?.username}</span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="flex items-center space-x-1 text-sm font-bold text-danger hover:opacity-80"
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
