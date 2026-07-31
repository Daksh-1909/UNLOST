import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, HelpCircle, FileText, AlertCircle, Image as ImageIcon, MapPin, Calendar, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tapHoverVariants, buttonHoverVariants, TRANSITION_BASE } from '../utils/animations';

const CATEGORIES = ['Accessories', 'Books', 'Electronics', 'Other'];

const Report: React.FC = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Form states
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [category, setCategory] = useState(CATEGORIES[0]);
 const [location, setLocation] = useState('');
 const [status, setStatus] = useState('Lost');
 const [contactInfo, setContactInfo] = useState('');
 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [image, setImage] = useState<File | null>(null);
 const [imagePreview, setImagePreview] = useState<string | null>(null);
 const [securityQuestion, setSecurityQuestion] = useState('');
 const [securityAnswer, setSecurityAnswer] = useState('');

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 setImage(file);
 const reader = new FileReader();
 reader.onloadend = () => {
 setImagePreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title || !description || !category || !location || !status || !contactInfo) {
 setError('Please fill in all required fields.');
 return;
 }

 if ((securityQuestion && !securityAnswer) || (!securityQuestion && securityAnswer)) {
 setError('Both Security Question and Answer must be provided together, or leave both empty.');
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const formData = new FormData();
 formData.append('title', title);
 formData.append('description', description);
 formData.append('category', category);
 formData.append('location', location);
 formData.append('status', status);
 formData.append('contact_info', contactInfo);
 formData.append('date', date);
 if (image) formData.append('image', image);
 if (securityQuestion) formData.append('security_question', securityQuestion);
 if (securityAnswer) formData.append('security_answer', securityAnswer);

 const response = await fetch('/api/report', {
 method: 'POST',
 body: formData, // fetch automatically configures multipart boundary
 });
 const data = await response.json();
 if (response.ok && data.success) {
 setSuccess(true);
 setTimeout(() => {
 navigate('/items');
 }, 1800);
 } else {
 setError(data.message || 'Failed to submit report.');
 }
 } catch (err) {
 console.error('Report submission error:', err);
 setError('An error occurred. Please try again.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-3xl mx-auto space-y-8">
 <div>
 <h1 className="text-3xl font-extrabold font-heading text-text tracking-tight">Report Item</h1>
 <p className="text-sm text-textSecondary">Post details of a lost or found item to help recover it</p>
 </div>

 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 className="glass-panel rounded-xl p-6 sm:p-8"
 >
  <AnimatePresence mode="wait">
    {success ? (
      <motion.div
        key="success-state"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={TRANSITION_BASE}
        className="py-16 flex flex-col items-center justify-center text-center space-y-4"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-success" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text">Report Submitted!</h2>
        <p className="text-textSecondary">Your item has been successfully posted to the directory.</p>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mt-4" />
      </motion.div>
    ) : (
      <motion.form 
        key="form-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={TRANSITION_BASE}
        onSubmit={handleSubmit} 
        className="space-y-6"
      >
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl flex items-start gap-2.5"
            >
              <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

 {/* Title & Status */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="md:col-span-2 space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <FileText className="h-3.5 w-3.5" />
 <span>Item Title <span className="text-danger">*</span></span>
 </label>
 <input
 type="text"
 required
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="e.g. Leather Wallet, Calculus Book"
 className="glass-input w-full"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <Tag className="h-3.5 w-3.5" />
 <span>Status <span className="text-danger">*</span></span>
 </label>
 <div className="grid grid-cols-2 gap-2 bg-[#5C321E]/5 p-1.5 rounded-xl border border-[#5C321E]/15">
 {['Lost', 'Found'].map((st) => (
            <motion.button
              key={st}
              type="button"
              variants={tapHoverVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setStatus(st)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                status === st
                  ? 'bg-[#5C321E] text-white shadow-sm'
                  : 'text-[#926347] hover:text-[#5C321E] hover:bg-[#5C321E]/5'
              }`}
            >
              {st}
            </motion.button>
 ))}
 </div>
 </div>
 </div>

 {/* Description */}
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <FileText className="h-3.5 w-3.5" />
 <span>Description <span className="text-danger">*</span></span>
 </label>
 <textarea
 required
 rows={4}
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Describe characteristics, tags, brands, content, cash inside, etc."
 className="glass-input w-full resize-none"
 />
 </div>

 {/* Category, Location, Date */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <Tag className="h-3.5 w-3.5" />
 <span>Category <span className="text-danger">*</span></span>
 </label>
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="glass-input w-full appearance-none cursor-pointer"
 >
 {CATEGORIES.map((cat) => (
 <option key={cat} value={cat}>{cat}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <MapPin className="h-3.5 w-3.5" />
 <span>Location <span className="text-danger">*</span></span>
 </label>
 <input
 type="text"
 required
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 placeholder="e.g. Library 2nd Floor, Cafeteria"
 className="glass-input w-full"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <Calendar className="h-3.5 w-3.5" />
 <span>Date <span className="text-danger">*</span></span>
 </label>
 <input
 type="date"
 required
 value={date}
 onChange={(e) => setDate(e.target.value)}
 className="glass-input w-full"
 />
 </div>
 </div>

 {/* Contact details */}
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <PlusCircle className="h-3.5 w-3.5" />
 <span>Contact Information <span className="text-danger">*</span></span>
 </label>
 <input
 type="text"
 required
 value={contactInfo}
 onChange={(e) => setContactInfo(e.target.value)}
 placeholder="e.g. Email (student@campus.edu), phone, or specific social handle"
 className="glass-input w-full"
 />
 </div>

 {/* Image Upload */}
 <div className="space-y-2">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <ImageIcon className="h-3.5 w-3.5" />
 <span>Upload Image (Optional)</span>
 </label>
 <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#5C321E]/5 p-4 rounded-xl border border-[#926347]/20">
 <input
 type="file"
 accept="image/png, image/jpeg, image/gif"
 onChange={handleImageChange}
 className="hidden"
 id="item-image-file"
 />
 <label
 htmlFor="item-image-file"
 className="px-4 py-2.5 bg-[#5C321E] hover:bg-[#6D3D24] shadow-md shadow-[#5C321E]/20 border border-[#926347]/30 rounded-xl cursor-pointer text-xs font-semibold text-white transition-all flex items-center gap-1.5"
 >
 <ImageIcon className="h-4 w-4 text-white/80" />
 <span>Choose Image</span>
 </label>

        <AnimatePresence mode="wait">
          {imagePreview ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={TRANSITION_BASE}
              className="relative h-20 w-20 rounded-lg overflow-hidden border border-[#926347]/30 flex-shrink-0"
            >
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              <motion.button
                type="button"
                variants={tapHoverVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-0.5 right-0.5 bg-danger rounded-xl p-0.5 text-white hover:bg-danger/80 shadow-sm shadow-danger/50"
              >
                <PlusCircle className="h-3 w-3 rotate-45" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.span 
              key="no-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium text-textSecondary"
            >
              No file chosen
            </motion.span>
          )}
        </AnimatePresence>
      </div>
 </div>

 <div className="space-y-4 pt-4 border-t border-white/5">
 <div className="flex items-center gap-2 text-success">
 <ShieldCheck className="h-5 w-5" />
 <h3 className="text-sm font-bold uppercase tracking-wider font-heading">Claim Lock Security (Optional)</h3>
 </div>
 <p className="text-xs text-textSecondary">
 Set a security checking query. When other users click claim, they must answer correctly to unlock contact information.
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <HelpCircle className="h-3.5 w-3.5 text-textMuted" />
 <span>Security Question</span>
 </label>
 <input
 type="text"
 value={securityQuestion}
 onChange={(e) => setSecurityQuestion(e.target.value)}
 placeholder="e.g. What stickers are on the back?"
 className="glass-input w-full"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[#926347] uppercase tracking-wider flex items-center gap-1">
 <ShieldCheck className="h-3.5 w-3.5 text-textMuted" />
 <span>Expected Answer</span>
 </label>
 <input
 type="text"
 value={securityAnswer}
 onChange={(e) => setSecurityAnswer(e.target.value)}
 placeholder="e.g. Hydroflask sticker, yellow smile"
 className="glass-input w-full"
 />
 </div>
 </div>
 </div>

      <motion.button
        type="submit"
        disabled={loading}
        variants={buttonHoverVariants}
        whileHover={!loading ? "hover" : ""}
        whileTap={!loading ? "tap" : ""}
        className="w-full py-3.5 rounded-xl bg-[#5C321E] hover:bg-[#6D3D24] shadow-lg shadow-[#5C321E]/25 transition-colors disabled:opacity-80 text-sm font-semibold flex items-center justify-center gap-2 text-white"
      >
        {loading ? (
          <>
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="h-4 w-4 rounded-xl border-2 border-white/30 border-t-white"
            />
            <span>Posting Report...</span>
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4" />
            <span>Report Item</span>
          </>
        )}
      </motion.button>
    </motion.form>
  )}
  </AnimatePresence>
 </motion.div>
 </div>
 );
};

export default Report;
