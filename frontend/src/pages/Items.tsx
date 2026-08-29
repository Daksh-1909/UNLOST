import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Calendar, Tag, Filter, ShieldCheck, CheckCircle2, AlertCircle, X, HelpCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tapHoverVariants, buttonHoverVariants, scrollRevealVariants, scrollRevealViewport, staggerContainer, staggerItem, TRANSITION_BASE } from '../utils/animations';
import { useAuth } from '../context/AuthContext';

interface Item {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  date: string;
  image_file: string | null;
  security_question: string | null;
  has_security_answer: boolean;
  reporter_email: string;
}

const CATEGORIES = ['Accessories', 'Books', 'Electronics', 'Other'];
const STATUSES = ['Lost', 'Found', 'Claimed'];

const Items: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');

  // Modal claim state
  const [claimingItem, setClaimingItem] = useState<Item | null>(null);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; data?: string; message?: string } | null>(null);

  const fetchItems = async (isInitial = false) => {
    if (isInitial || items.length === 0) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (date) params.append('date', date);

      const response = await fetch(`/api/items?${params.toString()}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, category, status, date]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingItem || !claimAnswer.trim()) return;

    const targetId = (claimingItem as any)._id || claimingItem.id;
    if (!targetId) return;

    setVerifying(true);
    setVerificationResult(null);
    try {
      const response = await fetch('/api/verify_claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: targetId, answer: claimAnswer }),
      });
      const data = await response.json();
      if (data.success) {
        setVerificationResult({ success: true, data: data.contact_info || data.message });
        setItems(prev => prev.map(i => (((i as any)._id === targetId || i.id === targetId) ? { ...i, status: 'Claimed' } : i)));
      } else {
        setVerificationResult({ success: false, message: data.message || 'Verification failed.' });
      }
    } catch (error) {
      console.error('Claim verification error:', error);
      setVerificationResult({ success: false, message: 'Server error while verifying claim.' });
    } finally {
      setVerifying(false);
    }
  };

  const closeClaimModal = () => {
    setClaimingItem(null);
    setClaimAnswer('');
    setVerificationResult(null);
  };

  useEffect(() => {
    if (claimingItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [claimingItem]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div 
      variants={scrollRevealVariants} 
      initial="hidden" 
      whileInView="visible" 
      viewport={scrollRevealViewport} 
      className="space-y-8"
    >
      {/* Header and overview */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-text tracking-tight">Search Directory</h1>
        <p className="text-sm text-textSecondary">Search reported items and verify claims to unlock contact information</p>
      </div>

      {/* Filter and search block */}
      <div className="glass-panel rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search items by title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input !pl-10 w-full"
          />
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full appearance-none !pr-8 cursor-pointer"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Filter className="absolute right-3.5 top-3.5 h-4 w-4 text-textMuted pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="glass-input w-full appearance-none !pr-8 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <Filter className="absolute right-3.5 top-3.5 h-4 w-4 text-textMuted pointer-events-none" />
        </div>

        {/* Date Filter */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="glass-input w-full cursor-pointer"
        />
      </div>

      {/* Item Display list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-card rounded-xl h-80 animate-pulse bg-primary/5"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div 
          variants={scrollRevealVariants} 
          initial="hidden" 
          animate="visible"
          className="glass-panel rounded-xl p-16 text-center text-textSecondary border border-dashed border-primary/20 bg-primary/5"
        >
          <AlertCircle className="h-12 w-12 text-textMuted mx-auto mb-4" />
          <p className="text-lg font-semibold">No items match your criteria.</p>
          <p className="text-sm text-textMuted mt-1">Try relaxing filters or search fields.</p>
        </motion.div>
      ) : (
        <motion.div 
          layout
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={scrollRevealViewport}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={(item as any)._id || item.id}
                layout
                variants={{ ...staggerItem, ...tapHoverVariants }}
                whileHover="hover"
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card rounded-xl flex flex-col overflow-hidden group"
              >
                {/* Clickable Image & Content Details */}
                <div 
                  className="cursor-pointer flex-1 flex flex-col"
                  onClick={() => navigate(`/item/${(item as any)._id || item.id}`)}
                >
                  {/* Image Placeholder */}
                  <div className="h-44 w-full bg-surface/50 relative overflow-hidden flex items-center justify-center border-b border-primary/10">
                    {item.image_file ? (
                      <img 
                        src={item.image_file.startsWith('data:') || item.image_file.startsWith('http') ? item.image_file : `/static/uploads/${item.image_file}`} 
                        alt={item.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-textMuted">
                        <Tag className="h-10 w-10 text-primary/40" />
                        <span className="text-xs uppercase tracking-wider">{item.category}</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-xl shadow-md select-none ${
                      item.status === 'Lost' 
                        ? 'bg-danger/10 text-danger border border-danger/20' 
                        : item.status === 'Claimed'
                        ? 'bg-textMuted/10 text-textSecondary border border-textMuted/20'
                        : 'bg-success/10 text-success border border-success/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Content details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-text transition-colors line-clamp-1 group-hover:text-primary">
                        {item.title}
                      </h3>
                      <p className="text-sm text-textSecondary line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-textSecondary pt-2 border-t border-primary/10">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-textMuted" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-textMuted" />
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim Button Footer */}
                <div className="p-5 pt-0">
                  {item.status !== 'Claimed' && (
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        setClaimingItem(item);
                      }}
                      variants={buttonHoverVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="w-full py-2.5 rounded-xl btn-primary-custom transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{user ? 'Claim Item' : 'Log In to Claim'}</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Claim Modal overlay */}
      {createPortal(
        <AnimatePresence>
          {claimingItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TRANSITION_BASE}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
              onClick={closeClaimModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={TRANSITION_BASE}
                className="glass-panel w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border border-primary/20 bg-surface/95"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="border-b border-primary/10 p-5 flex items-center justify-between bg-surface/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-extrabold font-heading text-lg text-text tracking-tight">Security Claim Verification</h3>
                  </div>
                  <motion.button
                    onClick={closeClaimModal}
                    variants={tapHoverVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="p-1.5 rounded-lg text-textMuted hover:text-text hover:bg-primary/5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Modal body */}
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-bold text-text text-base">{claimingItem.title}</h4>
                    <p className="text-sm text-textSecondary">{claimingItem.description}</p>
                  </div>

                  <form onSubmit={handleClaimSubmit} className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-primary font-semibold text-xs uppercase tracking-wider">
                        <HelpCircle className="h-4 w-4" />
                        <span>Verification Detail / Security Question</span>
                      </div>
                      <p className="text-sm text-text">
                        {claimingItem.security_question || 'Describe a unique mark, scratch, serial number, or exact contents inside this item.'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Your Answer / Proof of Ownership</label>
                      <textarea
                        required
                        rows={3}
                        value={claimAnswer}
                        onChange={(e) => setClaimAnswer(e.target.value)}
                        placeholder="Provide details to verify your claim..."
                        className="glass-input w-full resize-none"
                        disabled={verifying || (verificationResult?.success ?? false)}
                      />
                    </div>

                    {verificationResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={TRANSITION_BASE}
                        className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
                          verificationResult.success
                            ? 'bg-success/10 border-success/20 text-success'
                            : 'bg-danger/10 border-danger/20 text-danger'
                        }`}
                      >
                        {verificationResult.success ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-bold">Claim Verified Successfully!</span>
                              <div className="flex items-center gap-1.5 text-text font-medium bg-success/20 p-2 rounded-lg border border-success/10 mt-1">
                                <Mail className="h-4 w-4 text-success" />
                                <span>{verificationResult.data}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                            <span>{verificationResult.message}</span>
                          </>
                        )}
                      </motion.div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeClaimModal}
                        className="flex-1 py-3 rounded-xl border border-primary/20 text-textSecondary hover:bg-primary/5 transition-all text-sm font-semibold"
                      >
                        Cancel
                      </button>

                      {!verificationResult?.success && (
                        <motion.button
                          type="submit"
                          disabled={verifying}
                          variants={buttonHoverVariants}
                          whileHover={!verifying ? "hover" : ""}
                          whileTap={!verifying ? "tap" : ""}
                          className="flex-1 py-3 rounded-xl btn-primary-custom disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          {verifying ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }} 
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="h-4 w-4 rounded-xl border-2 border-white/30 border-t-white"
                              />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              <span>Submit Claim</span>
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

export default Items;
