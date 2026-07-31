import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, LayoutGrid, PlusCircle, Shield, User, Phone, Home, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tapHoverVariants, TRANSITION_BASE } from '../utils/animations';

const MotionLink = motion(Link);

const Navbar: React.FC = () => {
 const { user, logout } = useAuth();
 const location = useLocation();
 const [isOpen, setIsOpen] = useState(false);
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);

 const navigation = [
 { name: 'Home', href: '/', icon: Home },
 { name: 'Items', href: '/items', icon: LayoutGrid },
 { name: 'Report', href: '/report', icon: PlusCircle },
 { name: 'Contact', href: '/contact', icon: Phone },
 ];

 if (user?.is_admin) {
 navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
 }

 const isActive = (path: string) => {
 if (path === '/') return location.pathname === '/';
 return location.pathname.startsWith(path);
 };

 return (
 <nav className="sticky top-0 z-50 glass-panel border-b-0 border-b-white/5 rounded-none">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 <div className="flex items-center">
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
 
 {/* Desktop Nav */}
 <div className="hidden md:flex items-center space-x-6">
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
 className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-xl bg-primary"
 transition={{ duration: 0.2, ease:"easeOut" }}
 />
 )}
 </MotionLink>
 );
 })}
 
 <div className="h-4 w-px bg-white/10 mx-2"></div>
 
 <div className="relative">
 <motion.button 
 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
 className="flex items-center space-x-2 focus:outline-none group hover:opacity-80 transition-opacity"
 whileHover="hover"
 whileTap="tap"
 variants={tapHoverVariants}
 >
 {user?.profilePicture ? (
 <img src={user.profilePicture} alt="Avatar" className="h-8 w-8 rounded-xl border border-white/10" />
 ) : (
 <div className="h-8 w-8 rounded-xl bg-surface flex items-center justify-center border border-white/5">
 <User className="h-4 w-4 text-textSecondary" />
 </div>
 )}
 <ChevronDown className="w-3 h-3 text-textMuted group-hover:text-text transition-colors" />
 </motion.button>
 
 <AnimatePresence>
 {isDropdownOpen && (
 <motion.div
 initial={{ opacity: 0, y: 8, scale: 0.98 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 8, scale: 0.98 }}
 transition={TRANSITION_BASE}
 className="absolute right-0 mt-3 w-56 rounded-xl glass-panel shadow-lg py-2 focus:outline-none"
 >
 <div className="px-4 py-2 mb-2 border-b border-white/5">
 <p className="text-sm font-medium text-text truncate">{user?.username}</p>
 <p className="text-xs text-textMuted truncate">{user?.email}</p>
 </div>
 <MotionLink to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-textSecondary hover:text-primary hover:bg-white/5 transition-colors" whileHover="hover" whileTap="tap" variants={tapHoverVariants}>
 <User className="mr-3 h-4 w-4" /> Profile
 </MotionLink>
 <motion.button
 onClick={() => { setIsDropdownOpen(false); logout(); }}
 className="flex w-full items-center px-4 py-2 text-sm text-textSecondary hover:text-danger hover:bg-white/5 transition-colors"
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
 </div>

 {/* Mobile menu toggle */}
 <div className="md:hidden">
 <motion.button
 onClick={() => setIsOpen(!isOpen)}
 className="inline-flex items-center justify-center p-2 rounded-md text-textSecondary hover:text-text focus:outline-none"
 whileHover="hover"
 whileTap="tap"
 variants={tapHoverVariants}
 >
 {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
 </motion.button>
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
 transition={TRANSITION_BASE}
 className="md:hidden border-t border-white/5 bg-surface overflow-hidden"
 >
 <div className="px-4 py-4 space-y-1">
 {navigation.map((item) => {
 const active = isActive(item.href);
 return (
 <MotionLink
 key={item.name}
 to={item.href}
 onClick={() => setIsOpen(false)}
 className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
 active ? 'text-primary bg-primary/10' : 'text-textSecondary hover:text-text hover:bg-white/5'
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
 <MotionLink to="/profile" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-textSecondary hover:text-text hover:bg-white/5 transition-colors" whileHover="hover" whileTap="tap" variants={tapHoverVariants}>
 <User className="mr-3 h-4 w-4" /> Profile
 </MotionLink>
 <motion.button
 onClick={() => { setIsOpen(false); logout(); }}
 className="flex w-full items-center px-3 py-3 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
 whileHover="hover"
 whileTap="tap"
 variants={tapHoverVariants}
 >
 <LogOut className="mr-3 h-4 w-4" /> Logout
 </motion.button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </nav>
 );
};

export default Navbar;
