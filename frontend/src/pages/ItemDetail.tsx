import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Calendar, Tag, ShieldCheck, CheckCircle2, User, Download, AlertCircle, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scrollRevealVariants, buttonHoverVariants, TRANSITION_BASE } from '../utils/animations';
import { useAuth } from '../context/AuthContext';

interface Item {
  _id: string;
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
  contact_info?: string;
}

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  // Claim state
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; message?: string; data?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/items/${id}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setItem(data.item);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchItem();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (isClaiming) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isClaiming]);

  const handleDownloadQR = () => {
    const svg = document.getElementById('item-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-${item?.title.replace(/\s+/g, '-')}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAnswer.trim()) return;

    setSubmittingClaim(true);
    setClaimResult(null);
    try {
      const response = await fetch('/api/verify_claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: id, answer: claimAnswer }),
      });
      const data = await response.json();
      if (data.success) {
        setClaimResult({
          success: true,
          message: data.message || 'Security check passed! Claim submitted successfully.',
          data: data.contact_info
        });
        setItem(prev => prev ? { ...prev, status: 'Claimed' } : null);
        window.dispatchEvent(new Event('unlost:item_updated'));
      } else {
        setClaimResult({
          success: false,
          message: data.message || 'Incorrect verification answer. Please try again.'
        });
      }
    } catch (error) {
      console.error('Claim verification error:', error);
      setClaimResult({ success: false, message: 'Server error while verifying claim.' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const closeClaimModal = () => {
    setIsClaiming(false);
    setClaimAnswer('');
    setClaimResult(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-textSecondary">Loading item...</div>;
  }

  if (!item) {
    return <div className="flex justify-center items-center h-64 text-danger">Item not found.</div>;
  }

  const timelineStages = ['Reported', 'Matched', 'Claimed', 'Returned'];
  const getStageIndex = (status: string) => {
    if (status === 'Lost' || status === 'Found') return 0; // Reported
    if (status === 'Claimed') return 2;
    if (status === 'Returned') return 3;
    return 0;
  };
  const currentStageIdx = getStageIndex(item.status);

  return (
    <motion.div
      variants={scrollRevealVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
    >
      <button onClick={() => navigate(-1)} className="text-sm text-textSecondary hover:text-text cursor-pointer">&larr; Back</button>

      {/* Progress Tracker / Timeline */}
      <div className="glass-panel p-6 mb-8">
        <h3 className="text-lg font-bold mb-4 text-center">Item Lifecycle Status</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border/30 -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-success -z-10 transition-all duration-500" 
            style={{ width: `${(currentStageIdx / (timelineStages.length - 1)) * 100}%` }} 
          />
          {timelineStages.map((stage, idx) => {
            const isCompleted = idx <= currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <div key={stage} className="flex flex-col items-center gap-2 bg-surface p-2 rounded-xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-success border-success text-white' : 'bg-surface border-border text-border'}`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-border" />}
                </div>
                <span className={`text-xs font-bold ${isCurrent ? 'text-text' : 'text-textSecondary'}`}>{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            {item.image_file ? (
              <img
                src={item.image_file.startsWith('data:') || item.image_file.startsWith('http') ? item.image_file : `/static/uploads/${item.image_file}`}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="w-full h-80 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/E6CAAB/5C321E?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-80 bg-primary/10 flex flex-col items-center justify-center text-textSecondary">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                <p>No image provided</p>
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold font-heading text-text">{item.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  item.status === 'Lost' ? 'bg-danger/20 text-danger' : 
                  item.status === 'Found' ? 'bg-success/20 text-success' : 
                  item.status === 'Returned' ? 'bg-primary/20 text-primary' :
                  'bg-warning/20 text-warning'
                }`}>
                  {item.status}
                </span>
              </div>
              
              <p className="text-textSecondary leading-relaxed">{item.description}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 text-textSecondary">
                  <Tag className="w-5 h-5 text-primary" />
                  <span>{item.category}</span>
                </div>
                <div className="flex items-center gap-2 text-textSecondary">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2 text-textSecondary">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-textSecondary">
                  <User className="w-5 h-5 text-primary" />
                  <span className="truncate">Reported by: {item.reporter_email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Actions */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-lg border-b border-border/30 pb-2">Actions</h3>
            {item.status === 'Found' || item.status === 'Lost' ? (
              user ? (
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsClaiming(true);
                    setClaimResult(null);
                  }}
                  className="w-full flex items-center justify-center py-3 bg-primary-gradient text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <ShieldCheck className="w-5 h-5 mr-2" /> Claim This Item
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center py-3 bg-primary-gradient text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <User className="w-5 h-5 mr-2" /> Log In to Claim Item
                </motion.button>
              )
            ) : item.status === 'Claimed' ? (
              <div className="p-3 rounded-xl bg-warning/20 text-warning text-sm font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Claim Pending Verification
              </div>
            ) : item.status === 'Returned' ? (
              <div className="p-3 rounded-xl bg-success/20 text-success text-sm font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Item Returned to Owner
              </div>
            ) : (
              <p className="text-sm text-textSecondary text-center">No actions available.</p>
            )}
          </div>

          {/* QR Code */}
          {item.status === 'Found' && (
            <div className="glass-card p-6 flex flex-col items-center space-y-4">
              <h3 className="font-bold text-lg text-center">Item QR Code</h3>
              <p className="text-xs text-textSecondary text-center mb-2">Print and attach this to the physical item for quick scanning.</p>
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG 
                  id="item-qr-code"
                  value={window.location.href} 
                  size={150} 
                  bgColor={"#ffffff"} 
                  fgColor={"#000000"} 
                  level={"Q"}
                />
              </div>
              <motion.button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors cursor-pointer"
                variants={buttonHoverVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Download className="w-4 h-4 mr-2" /> Download QR
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {createPortal(
        <AnimatePresence>
          {isClaiming && (
            <motion.div
              key="item-detail-claim-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeClaimModal();
                }
              }}
            >
              <motion.div
                key="item-detail-claim-content"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={TRANSITION_BASE}
                className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-primary/20 bg-surface text-text backdrop-blur-xl p-6 md:p-8 space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold font-heading text-text">Verify Your Claim</h2>
                    <p className="text-textSecondary text-sm">
                      To claim this item, please answer the security question provided by the finder.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeClaimModal}
                    className="p-1 rounded-lg text-textMuted hover:text-text hover:bg-primary/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleClaimSubmit} className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">Security Question / Verification Detail</label>
                    <p className="text-sm font-medium text-text">
                      {item.security_question || "Describe a unique mark, scratch, serial number, or exact contents of this item."}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">Your Answer / Proof of Ownership</label>
                    <textarea
                      required
                      value={claimAnswer}
                      onChange={(e) => setClaimAnswer(e.target.value)}
                      disabled={submittingClaim || (claimResult?.success ?? false)}
                      className="w-full resize-none bg-background border border-primary/20 text-text placeholder-textMuted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3.5 text-sm transition-all min-h-[100px] disabled:opacity-50"
                      placeholder="Type your verification answer here..."
                    />
                  </div>

                  {claimResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={TRANSITION_BASE}
                      className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
                        claimResult.success
                          ? 'bg-success/15 border-success/30 text-success'
                          : 'bg-danger/15 border-danger/30 text-danger'
                      }`}
                    >
                      {claimResult.success ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold">{claimResult.message}</span>
                            {claimResult.data && (
                              <div className="flex items-center gap-1.5 text-text font-medium bg-success/20 p-2 rounded-lg border border-success/10 mt-1">
                                <Mail className="h-4 w-4 text-success flex-shrink-0" />
                                <span>{claimResult.data}</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                          <span>{claimResult.message}</span>
                        </>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeClaimModal}
                      className="flex-1 py-3 rounded-xl border border-primary/25 text-text hover:bg-primary/10 transition-all text-sm font-bold cursor-pointer"
                    >
                      {claimResult?.success ? 'Close' : 'Cancel'}
                    </button>

                    {!claimResult?.success && (
                      <motion.button
                        type="submit"
                        disabled={submittingClaim}
                        variants={buttonHoverVariants}
                        whileHover={!submittingClaim ? "hover" : ""}
                        whileTap={!submittingClaim ? "tap" : ""}
                        className="flex-1 py-3 rounded-xl btn-primary-custom disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                      >
                        {submittingClaim ? (
                          <>
                            <motion.div 
                              animate={{ rotate: 360 }} 
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

export default ItemDetail;
