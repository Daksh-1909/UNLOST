import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Calendar, Tag, ShieldCheck, CheckCircle2, User, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scrollRevealVariants, buttonHoverVariants } from '../utils/animations';
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
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItem(data.item);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

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
        downloadLink.download = `qr-${item?.title.replace(/\\s+/g, '-')}.png`;
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
      const response = await fetch(`/api/items/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: claimAnswer }),
      });
      const data = await response.json();
      setClaimResult(data);
      if (data.success) {
        setItem(prev => prev ? { ...prev, status: 'Claimed' } : null);
        setTimeout(() => setIsClaiming(false), 2000);
      }
    } catch (error) {
      setClaimResult({ success: false, message: 'Server error' });
    } finally {
      setSubmittingClaim(false);
    }
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
      <button onClick={() => navigate(-1)} className="text-sm text-textSecondary hover:text-text">&larr; Back</button>

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
                src={`/static/uploads/${item.image_file}`}
                alt={item.title}
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
            {user && item.status === 'Found' && user.email !== item.reporter_email && (
              <motion.button
                onClick={() => setIsClaiming(true)}
                className="w-full flex items-center justify-center py-3 bg-primary-gradient text-white rounded-xl font-medium shadow-lg"
                variants={buttonHoverVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Claim this item
              </motion.button>
            )}
            
            {(!user || item.status !== 'Found' || user.email === item.reporter_email) && (
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
                onClick={handleDownloadQR}
                className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors"
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
      <AnimatePresence>
        {isClaiming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg glass-card bg-surface/95 p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold font-heading mb-2 text-text">Verify Your Claim</h2>
              <p className="text-textSecondary mb-6 text-sm">
                To claim this item, please answer the security question provided by the finder. An admin will review your answer.
              </p>

              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Security Question / Verification Detail</label>
                  <p className="text-sm text-text bg-primary/5 p-3 rounded-xl border border-primary/10 italic mb-4">
                    {item.security_question || "Describe a unique mark, scratch, or the exact contents of this item."}
                  </p>
                  <textarea
                    required
                    value={claimAnswer}
                    onChange={(e) => setClaimAnswer(e.target.value)}
                    className="w-full glass-input min-h-[100px]"
                    placeholder="Your detailed answer..."
                  />
                </div>

                {claimResult && (
                  <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${claimResult.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                    {claimResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <div className="w-5 h-5 shrink-0 bg-danger/50 rounded-full" />}
                    {claimResult.message}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClaiming(false);
                      setClaimResult(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-medium btn-secondary-custom"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="flex-1 py-3 px-4 rounded-xl font-medium btn-primary-custom disabled:opacity-50"
                  >
                    {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ItemDetail;
