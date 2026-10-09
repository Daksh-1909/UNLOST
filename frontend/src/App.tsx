import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { motion } from 'framer-motion';
import { pageVariants } from './utils/animations';
import { TransitionProvider } from './context/TransitionContext';

import Navbar from './components/Navbar';
import SmiloWidget from './components/SmiloWidget';

// Route Code-Splitting: Lazy load all pages on-demand for lightning-fast initial load
const Home = lazy(() => import('./pages/Home'));
const Items = lazy(() => import('./pages/Items'));
const Report = lazy(() => import('./pages/Report'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SmiloPage = lazy(() => import('./pages/SmiloPage'));
const ItemDetail = lazy(() => import('./pages/ItemDetail'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));

// Ultra-lightweight page loading skeleton
const PageLoader: React.FC = () => (
  <div className="w-full min-h-[50vh] flex items-center justify-center">
    <div className="relative flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
      <span className="absolute text-[10px] font-bold text-primary tracking-tight">UL</span>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-secondary/25 border-t-primary"></div>
          <span className="absolute text-xs font-bold text-primary">UL</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !(user.is_admin || user.role === 'admin')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Component to handle instant route transitions
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
            <Login />
          </motion.div>
        } />
        <Route path="/register" element={
          <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
            <Register />
          </motion.div>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <Home />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/items" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <Items />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <Report />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/contact" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <Contact />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <Profile />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <Admin />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/assistant" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <SmiloPage />
            </motion.div>
          </ProtectedRoute>
        } />
        
        <Route path="/item/:id" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <ItemDetail />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute requireAdmin>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <AdminAnalytics />
            </motion.div>
          </ProtectedRoute>
        } />
        
        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-background text-primary flex flex-col relative overflow-hidden">
        {/* Hardware-accelerated decorative background radial glows (0 CPU overhead) */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle 400px at 0% 0%, rgba(var(--color-primary), 0.12), transparent 70%),
              radial-gradient(circle 400px at 100% 100%, rgba(var(--color-secondary), 0.12), transparent 70%)
            `
          }}
        />
        
        {user && <Navbar />}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <AnimatedRoutes />
        </main>
        {user && <SmiloWidget />}
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TransitionProvider>
        <AppContent />
      </TransitionProvider>
    </AuthProvider>
  );
};

export default App;

