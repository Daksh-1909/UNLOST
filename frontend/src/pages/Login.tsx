import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHoverVariants } from '../utils/animations';
import { GoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !password) return;

  setLoading(true);
  setError(null);
  try {
  const result = await login(email, password);
  if (result.success) {
  navigate('/');
  } else {
  setError(result.message || 'Login failed.');
  }
  } catch (err) {
  setError('An unexpected error occurred. Please try again.');
  } finally {
  setLoading(false);
  }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
  if (!credentialResponse.credential) return;
  setLoading(true);
  setError(null);
  try {
  const result = await loginWithGoogle(credentialResponse.credential);
  if (result.success) {
  navigate('/');
  } else {
  setError(result.message || 'Google Login failed.');
  }
  } catch (err) {
  setError('An unexpected error occurred. Please try again.');
  } finally {
  setLoading(false);
  }
  };

  return (
  <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
  <motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4 }}
  className="max-w-md w-full space-y-8 glass-panel p-8 rounded-xl bg-surface/80 border border-primary/20 backdrop-blur-xl relative overflow-hidden"
  >
  <div className="absolute top-0 left-0 w-48 h-48 bg-primary/10 rounded-xl blur-3xl pointer-events-none"></div>
  <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/10 rounded-xl blur-3xl pointer-events-none"></div>

  {/* Brand header */}
  <div className="text-center space-y-2 z-10 relative">
  <Link to="/" className="inline-block">
  <span className="text-3xl font-extrabold bg-primary-gradient bg-clip-text text-transparent font-heading tracking-tight">
  UNLOST
  </span>
  </Link>
  <h2 className="text-xl font-bold font-heading text-text">Sign in to your account</h2>
  <p className="text-xs text-textSecondary">Enter your credentials below to browse active listings</p>
  </div>

  {/* Error notification */}
  <AnimatePresence>
  {error && (
  <motion.div
  initial={{ opacity: 0, y: -10, x: -10 }}
  animate={{ opacity: 1, y: 0, x: [0, -5, 5, -5, 5, 0] }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.4 }}
  className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl flex items-start gap-2.5 z-10 relative"
  >
  <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
  <span>{error}</span>
  </motion.div>
  )}
  </AnimatePresence>

  {/* Form */}
  <form onSubmit={handleSubmit} className="space-y-6 z-10 relative">
  <div className="space-y-4">
  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
  <Mail className="h-3.5 w-3.5" />
  <span>Email Address</span>
  </label>
  <input
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="student@campus.edu"
  className="glass-input w-full"
  />
  </div>

  <div className="space-y-1.5">
  <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
  <Lock className="h-3.5 w-3.5" />
  <span>Password</span>
  </label>
  <div className="relative">
  <input
  type={showPassword ? "text" : "password"}
  required
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter your password"
  className="glass-input w-full pr-10"
  />
  <button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-text focus:outline-none transition-colors p-1"
  tabIndex={-1}
  aria-label={showPassword ? "Hide password" : "Show password"}
  >
  {showPassword ? (
  <EyeOff className="h-4 w-4" />
  ) : (
  <Eye className="h-4 w-4" />
  )}
  </button>
  </div>
  </div>
  </div>

 <motion.button
 type="submit"
 disabled={loading}
 variants={buttonHoverVariants}
 whileHover={!loading ? "hover" : ""}
 whileTap={!loading ? "tap" : ""}
 className="w-full py-3.5 rounded-xl btn-primary-custom shadow-lg shadow-primary/25 transition-colors disabled:opacity-80 text-sm font-semibold flex items-center justify-center gap-2"
 >
 {loading ? (
 <>
 <motion.div 
 animate={{ rotate: 360 }} 
 transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
 className="h-4 w-4 rounded-xl border-2 border-white/30 border-t-white"
 />
 <span>Signing In...</span>
 </>
 ) : (
 <>
 <LogIn className="h-4 w-4" />
 <span>Sign In</span>
 </>
 )}
 </motion.button>
 </form>

 {/* Alternate log ins */}
 <div className="space-y-4 pt-6 border-t border-primary/10 z-10 relative">
 <div className="flex justify-center w-full">
 <GoogleLogin
 onSuccess={handleGoogleSuccess}
 onError={() => setError('Google Login was unsuccessful or cancelled.')}
 useOneTap
 theme="outline"
 shape="pill"
 size="large"
 />
 </div>

 <p className="text-center text-xs text-textSecondary">
 Don't have an account?{' '}
 <Link to="/register" className="text-primary hover:text-primary/80 font-semibold underline">
 Create account
 </Link>
 </p>
 </div>
 </motion.div>
 </div>
 );
};

export default Login;
