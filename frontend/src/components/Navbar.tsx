import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, LogOut, LayoutGrid, PlusCircle, Shield, User, Phone, Home, 
  ChevronDown, Sun, Moon, Bell, CheckCheck, Sparkles, Tag, ShieldAlert, 
  Clock, Package, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tapHoverVariants, TRANSITION_BASE } from '../utils/animations';
import { usePageTransition } from '../context/TransitionContext';

const MotionLink = motion(Link);

function formatTimeAgo(dateString: string | Date) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSec < 45) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { triggerTransition } = usePageTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Fetch notifications dynamically
  const fetchNotifications = React.useCallback(() => {
    if (!user) return;
    fetch('/api/notifications', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      })
      .catch((err) => {
        console.error('Error loading notifications:', err);
      });
  }, [user]);

  // Dynamic real-time polling every 5 seconds + focus/custom event listeners
  React.useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);

    const handleFocus = () => fetchNotifications();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    const handleItemUpdated = () => fetchNotifications();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('unlost:item_updated', handleItemUpdated);
    window.addEventListener('unlost:refresh_notifications', handleItemUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('unlost:item_updated', handleItemUpdated);
      window.removeEventListener('unlost:refresh_notifications', handleItemUpdated);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT', credentials: 'include' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT', credentials: 'include' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setIsNotificationsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const navRef = useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsNotificationsOpen(false);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
    setIsOpen(false);
  }, [location.pathname]);

  const isAdmin = Boolean(user?.is_admin || user?.role === 'admin');
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Items', href: '/items', icon: LayoutGrid },
    { name: 'Report', href: '/report', icon: PlusCircle },
    ...(!isAdmin ? [{ name: 'Contact', href: '/contact', icon: Phone }] : []),
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav ref={navRef} className="sticky top-0 z-50 glass-panel border-b-0 border-b-white/5 rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center z-10">
            <MotionLink 
              to="/" 
              className="flex-shrink-0 flex items-center space-x-2"
              whileHover="hover"
              whileTap="tap"
              variants={tapHoverVariants}
            >
              <span className="text-xl font-bold bg-primary-gradient bg-clip-text text-transparent tracking-tight font-heading">
                UNLOST
              </span>
            </MotionLink>
          </div>
          
          {/* Desktop Navigation Links (PERFECTLY CENTERED) */}
          <div className="hidden md:flex items-center justify-center space-x-6 absolute left-1/2 -translate-x-1/2 z-0">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <MotionLink
                  key={item.name}
                  to={item.href}
                  className={`relative py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                    active ? 'text-primary' : 'text-textSecondary hover:text-text'
                  }`}
                  whileHover="hover"
                  whileTap="tap"
                  variants={tapHoverVariants}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute -bottom-[2px] left-0 right-0 h-[3px] rounded-t-full bg-primary shadow-sm shadow-primary/50"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  )}
                </MotionLink>
              );
            })}
          </div>

          {/* Right Action Icons (Dark Mode, Notifications, User Profile / Mobile Toggle) */}
          <div className="flex items-center space-x-2 sm:space-x-3 z-10">
            
            {/* Dark Mode Toggle (Visible on Mobile & Desktop) */}
            <motion.button
              onClick={() => triggerTransition(() => setIsDark(!isDark))}
              className="p-2 rounded-xl text-textSecondary hover:text-text hover:bg-primary/10 transition-colors relative focus:outline-none"
              whileHover="hover"
              whileTap="tap"
              variants={tapHoverVariants}
              title="Toggle theme"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
            </motion.button>

            {/* Notifications Dropdown (Visible on Mobile & Desktop) */}
            {user && (
              <div className="relative">
                <motion.button
                  onClick={() => {
                    const nextState = !isNotificationsOpen;
                    setIsNotificationsOpen(nextState);
                    if (nextState) {
                      fetchNotifications();
                    }
                  }}
                  className={`p-2 rounded-xl transition-all relative focus:outline-none ${
                    isNotificationsOpen 
                      ? 'bg-primary/15 text-primary' 
                      : 'text-textSecondary hover:text-text hover:bg-primary/10'
                  }`}
                  whileHover="hover"
                  whileTap="tap"
                  variants={tapHoverVariants}
                  aria-label="Notifications"
                >
                  <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary animate-wiggle' : ''}`} />
                  
                  {/* Dynamic Blinking / Pulsing Red Dot on Bell */}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-3 w-3 pointer-events-none">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-surface shadow-sm shadow-red-500/80" />
                    </span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={TRANSITION_BASE}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 divide-y divide-white/5"
                    >
                      {/* Notifications Header */}
                      <div className="p-3.5 px-4 font-bold text-text flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-danger/15 text-danger rounded-full border border-danger/25 animate-pulse">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                            title="Mark all notifications as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* Notification Items List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                              <Bell className="w-5 h-5 opacity-60" />
                            </div>
                            <p className="text-sm font-medium text-text">All caught up!</p>
                            <p className="text-xs text-textMuted">No new notifications at this time.</p>
                          </div>
                        ) : (
                          notifications.map(n => {
                            const isLost = n.type === 'item_lost' || n.item_status === 'Lost';
                            const isFound = n.type === 'item_found' || n.item_status === 'Found';
                            const isAdminAlert = n.type === 'admin_alert' || n.forAdmin;
                            const isMatch = n.type === 'match';

                            return (
                              <div 
                                key={n._id} 
                                className={`p-3.5 transition-all flex items-start gap-3 cursor-pointer group ${
                                  n.isRead 
                                    ? 'opacity-65 hover:opacity-100 hover:bg-white/[0.02]' 
                                    : 'bg-primary/[0.06] hover:bg-primary/[0.12] border-l-2 border-l-primary'
                                }`}
                                onClick={() => handleNotificationClick(n)}
                              >
                                {/* Left Status Icon / Badge */}
                                <div className="flex-shrink-0 mt-0.5">
                                  {isAdminAlert ? (
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                                      <ShieldAlert className="w-4 h-4" />
                                    </div>
                                  ) : isMatch ? (
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                      <Sparkles className="w-4 h-4" />
                                    </div>
                                  ) : isLost ? (
                                    <div className="w-8 h-8 rounded-xl bg-danger/15 border border-danger/30 flex items-center justify-center text-danger">
                                      <Tag className="w-4 h-4" />
                                    </div>
                                  ) : isFound ? (
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                                      <Bell className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>

                                {/* Main Text Body */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {isAdminAlert && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        Admin Alert
                                      </span>
                                    )}
                                    {isLost && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-danger/20 text-danger border border-danger/30">
                                        Lost Item
                                      </span>
                                    )}
                                    {isFound && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Found Item
                                      </span>
                                    )}
                                    {isMatch && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        Potential Match
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs sm:text-sm text-text font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                    {n.message}
                                  </p>

                                  <div className="flex items-center gap-2 text-[11px] text-textMuted pt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTimeAgo(n.date)}
                                    </span>
                                    {n.item_location && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-[120px]">{n.item_location}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side: Thumbnail or Unread Dot */}
                                <div className="flex flex-col items-end justify-between flex-shrink-0 self-stretch">
                                  {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary animate-pulse mt-1" />
                                  )}
                                  {n.item_image && (
                                    <img 
                                      src={n.item_image} 
                                      alt="Thumbnail" 
                                      className="w-8 h-8 rounded-lg object-cover border border-white/10 mt-auto" 
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Desktop User Avatar Dropdown */}
            {user ? (
              <div className="relative hidden md:block">
                <motion.button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none group hover:opacity-80 transition-opacity p-1"
                  whileHover="hover"
                  whileTap="tap"
                  variants={tapHoverVariants}
                >
                  <img 
                    src={user?.profilePicture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
                    alt="Avatar" 
                    className="h-8 w-8 rounded-xl border border-white/10 object-cover" 
                    onError={(e) => { e.currentTarget.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"; }}
                  />
                  <ChevronDown className="w-3 h-3 text-textMuted group-hover:text-text transition-colors" />
                </motion.button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={TRANSITION_BASE}
                      className="absolute right-0 mt-3 w-56 rounded-xl glass-panel shadow-lg py-2 focus:outline-none z-50"
                    >
                      <div className="px-4 py-2 mb-2 border-b border-white/5">
                        <p className="text-sm font-medium text-text truncate">{user?.username}</p>
                        <p className="text-xs text-textMuted truncate">{user?.email}</p>
                      </div>
                      <MotionLink to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-textSecondary hover:text-primary hover:bg-primary/10 transition-colors" whileHover="hover" whileTap="tap" variants={tapHoverVariants}>
                        <User className="mr-3 h-4 w-4" /> Profile
                      </MotionLink>
                      <motion.button
                        onClick={() => { setIsDropdownOpen(false); logout(); }}
                        className="flex w-full items-center px-4 py-2 text-sm text-textSecondary hover:text-danger hover:bg-danger/10 transition-colors"
                        whileHover="hover"
                        whileTap="tap"
                        variants={tapHoverVariants}
                      >
                        <LogOut className="mr-3 h-4 w-4" /> Logout
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <MotionLink
                to="/login"
                className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-white btn-primary-custom"
                whileHover="hover"
                whileTap="tap"
                variants={tapHoverVariants}
              >
                Sign In
              </MotionLink>
            )}

            {/* Mobile Menu Toggle Button */}
            <div className="md:hidden flex items-center">
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-textSecondary hover:text-text hover:bg-primary/10 focus:outline-none"
                whileHover="hover"
                whileTap="tap"
                variants={tapHoverVariants}
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={TRANSITION_BASE}
            className="md:hidden border-t border-white/5 bg-surface/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <MotionLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'text-primary bg-primary/10' : 'text-textSecondary hover:text-text hover:bg-primary/10'
                    }`}
                    whileHover="hover"
                    whileTap="tap"
                    variants={tapHoverVariants}
                  >
                    <item.icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
                    <span>{item.name}</span>
                  </MotionLink>
                );
              })}
              
              <div className="border-t border-white/5 mt-4 pt-4 flex flex-col space-y-1">
                {user ? (
                  <>
                    <div className="px-3 py-2 flex items-center space-x-3 mb-2">
                      <img 
                        src={user?.profilePicture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
                        alt="Avatar" 
                        className="h-8 w-8 rounded-xl border border-white/10 object-cover" 
                      />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-text truncate">{user?.username}</p>
                        <p className="text-xs text-textMuted truncate">{user?.email}</p>
                      </div>
                    </div>
                    <MotionLink to="/profile" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-textSecondary hover:text-text hover:bg-primary/10 transition-colors" whileHover="hover" whileTap="tap" variants={tapHoverVariants}>
                      <User className="mr-3 h-4 w-4" /> Profile
                    </MotionLink>
                    <motion.button
                      onClick={() => { setIsOpen(false); logout(); }}
                      className="flex w-full items-center px-3 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                      whileHover="hover"
                      whileTap="tap"
                      variants={tapHoverVariants}
                    >
                      <LogOut className="mr-3 h-4 w-4" /> Logout
                    </motion.button>
                  </>
                ) : (
                  <MotionLink
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full justify-center items-center px-4 py-3 text-sm font-medium text-white btn-primary-custom rounded-xl"
                    whileHover="hover"
                    whileTap="tap"
                    variants={tapHoverVariants}
                  >
                    Sign In
                  </MotionLink>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
