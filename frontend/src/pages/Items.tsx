import React, { useEffect, useState } from 'react';
import { Search as SearchIcon, MapPin, Calendar, Tag, Filter, ShieldCheck, CheckCircle2, AlertCircle, X, HelpCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  id: string;
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

  const fetchItems = async () => {
    setLoading(true);
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

    setVerifying(true);
    setVerificationResult(null);
    try {
      const response = await fetch('/api/verify_claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: claimingItem.id, answer: claimAnswer }),
      });
      const data = await response.json();
      if (data.success) {
        setVerificationResult({ success: true, data: data.contact_info });
      } else {
        setVerificationResult({ success: false, message: data.message || 'Verification failed.' });
      }
    } catch (error) {
      console.error('Claim verification error:', error);
      setVerificationResult({ success: false, message: 'Server is currently unreachable.' });
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
    <div className="space-y-8">
      {/* Header and overview */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-text tracking-tight">Search Directory</h1>
        <p className="text-sm text-textSecondary">Search reported items and verify claims to unlock contact information</p>
      </div>

      {/* Filter and search block */}
      <div className="glass-panel rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search items by title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10 w-full"
          />
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full appearance-none pr-8 cursor-pointer"
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
            className="glass-input w-full appearance-none pr-8 cursor-pointer"
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
            <div key={n} className="glass-card rounded-2xl h-80 animate-pulse bg-primary/5"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-textSecondary border border-dashed border-primary/20 bg-primary/5">
          <AlertCircle className="h-12 w-12 text-textMuted mx-auto mb-4" />
          <p className="text-lg font-semibold">No items match your criteria.</p>
          <p className="text-sm text-textMuted mt-1">Try relaxing filters or search fields.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-2xl flex flex-col overflow-hidden group"
              >
                {/* Image Placeholder */}
                <div className="h-44 w-full bg-surface/50 relative overflow-hidden flex items-center justify-center border-b border-primary/10">
                  {item.image_file ? (
                    <img 
                      src={`/static/uploads/${item.image_file}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-textMuted">
                      <Tag className="h-10 w-10 text-primary/40" />
                      <span className="text-xs uppercase tracking-wider">{item.category}</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full shadow-md select-none ${
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
                    <h3 className="font-bold text-lg text-text group-hover:text-primary transition-colors line-clamp-1">
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

                  {item.status !== 'Claimed' && (
                    <button
                      onClick={() => setClaimingItem(item)}
                      className="w-full py-2.5 rounded-xl btn-primary-custom transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Claim Item</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Claim Modal overlay */}
      <AnimatePresence>
        {claimingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-primary/10"
            >
              {/* Modal header */}
              <div className="border-b border-primary/10 p-5 flex items-center justify-between bg-surface/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-extrabold font-heading text-lg text-text tracking-tight">Security Claim Verification</h3>
                </div>
                <button
                  onClick={closeClaimModal}
                  className="p-1.5 rounded-lg text-textMuted hover:text-text hover:bg-primary/5 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-text text-base">{claimingItem.title}</h4>
                  <p className="text-sm text-textSecondary">{claimingItem.description}</p>
                </div>

                {!claimingItem.has_security_answer ? (
                  <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                    <span>This item does not have a claim verification question configured. Please reach out to administration to verify identity.</span>
                  </div>
                ) : (
                  <form onSubmit={handleClaimSubmit} className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-primary font-semibold text-xs uppercase tracking-wider">
                        <HelpCircle className="h-4 w-4" />
                        <span>Security Question</span>
                      </div>
                      <p className="text-sm text-text">
                        {claimingItem.security_question || 'Describe ownership characteristics of this item.'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Your Answer</label>
                      <input
                        type="text"
                        required
                        value={claimAnswer}
                        onChange={(e) => setClaimAnswer(e.target.value)}
                        placeholder="Provide details to verify your claim..."
                        className="glass-input w-full"
                        disabled={verifying || (verificationResult?.success ?? false)}
                      />
                    </div>

                    {verificationResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
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

                    {!verificationResult?.success && (
                      <button
                        type="submit"
                        disabled={verifying}
                        className="w-full py-3 rounded-xl btn-primary-custom disabled:opacity-50 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        {verifying ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            <span>Verifying Claim Answer...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            <span>Verify Ownership</span>
                          </>
                        )}
                      </button>
                    )}
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Items;
