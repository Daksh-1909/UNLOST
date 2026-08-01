import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from './utils/animations';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Items from './pages/Items';
import Report from './pages/Report';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import SmiloWidget from './components/SmiloWidget';
import SmiloPage from './pages/SmiloPage';
import ItemDetail from './pages/ItemDetail';
import AdminAnalytics from './pages/AdminAnalytics';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Component to handle route animations
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Wrap protected routes to apply page transitions consistently */}
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
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-background text-primary flex flex-col relative overflow-hidden">
        {/* Decorative background glow blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>
        
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
      <AppContent />
    </AuthProvider>
  );
};

export default App;
