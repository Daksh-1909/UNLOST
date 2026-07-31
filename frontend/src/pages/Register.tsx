import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHoverVariants } from '../utils/animations';

const Register: React.FC = () => {
 const { registerUser } = useAuth();
 const navigate = useNavigate();
 
 const [username, setUsername] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!username || !email || !password || !confirmPassword) return;

 if (password !== confirmPassword) {
 setError('Passwords do not match.');
 return;
 }

 if (password.length < 6) {
 setError('Password must be at least 6 characters long.');
 return;
 }

 setLoading(true);
 setError(null);
 setSuccess(null);
 try {
 const result = await registerUser(username, email, password);
 if (result.success) {
 setSuccess(result.message || 'Account created successfully! Redirecting...');
 setTimeout(() => navigate('/login'), 2000);
 } else {
 setError(result.message || 'Registration failed.');
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
 <h2 className="text-xl font-bold font-heading text-text">Create a new account</h2>
 <p className="text-xs text-textSecondary">Join UNLOST to report and claim items on campus</p>
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

 {/* Success notification */}
 <AnimatePresence>
 {success && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.4 }}
 className="p-4 bg-success/10 border border-success/20 text-success text-sm rounded-xl flex items-start gap-2.5 z-10 relative"
 >
 <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
 <span>{success}</span>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Form */}
 <form onSubmit={handleSubmit} className="space-y-5 z-10 relative">
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
 <User className="h-3.5 w-3.5" />
 <span>Username</span>
 </label>
 <input
 type="text"
 required
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="Choose a username"
 className="glass-input w-full"
 />
 </div>

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
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Min. 6 characters"
 className="glass-input w-full"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
 <Lock className="h-3.5 w-3.5" />
 <span>Confirm Password</span>
 </label>
 <input
 type="password"
 required
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="Repeat password"
 className="glass-input w-full"
 />
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
 <span>Creating Account...</span>
 </>
 ) : (
 <>
 <UserPlus className="h-4 w-4" />
 <span>Sign Up</span>
 </>
 )}
 </motion.button>
 </form>

 <div className="pt-4 border-t border-primary/10 text-center text-xs text-textSecondary z-10 relative">
 Already have an account?{' '}
 <Link to="/login" className="text-primary hover:text-primary/80 font-semibold underline">
 Sign in
 </Link>
 </div>
 </motion.div>
 </div>
 );
};

export default Register;
