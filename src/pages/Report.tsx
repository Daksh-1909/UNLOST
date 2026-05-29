import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, HelpCircle, FileText, AlertCircle, Image as ImageIcon, MapPin, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['Accessories', 'Books', 'Electronics', 'Other'];

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
        navigate('/items');
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
        <h1 className="text-3xl font-extrabold font-heading text-white tracking-tight">Report Item</h1>
        <p className="text-sm text-slate-400">Post details of a lost or found item to help recover it</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 sm:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Item Title <span className="text-rose-500">*</span></span>
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Status <span className="text-rose-500">*</span></span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-1.5 rounded-xl border border-slate-800">
                {['Lost', 'Found'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      status === st
                        ? st === 'Lost'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>Description <span className="text-rose-500">*</span></span>
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Category <span className="text-rose-500">*</span></span>
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>Location <span className="text-rose-500">*</span></span>
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Date <span className="text-rose-500">*</span></span>
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
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Contact Information <span className="text-rose-500">*</span></span>
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
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Upload Image (Optional)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/20 p-4 rounded-xl border border-slate-800">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="item-image-file"
              />
              <label
                htmlFor="item-image-file"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl cursor-pointer text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
              >
                <ImageIcon className="h-4 w-4 text-indigo-400" />
                <span>Choose Image</span>
              </label>

              {imagePreview ? (
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-0.5 right-0.5 bg-rose-600 rounded-full p-0.5 text-white hover:bg-rose-500"
                  >
                    <PlusCircle className="h-3 w-3 rotate-45" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-500">No file chosen</span>
              )}
            </div>
          </div>

          {/* Security Claims Question Configurations */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-heading">Claim Lock Security (Optional)</h3>
            </div>
            <p className="text-xs text-slate-500">
              Set a security checking query. When other users click claim, they must answer correctly to unlock contact information.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
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
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition-all text-sm font-semibold flex items-center justify-center gap-2 text-white"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Posting Report...</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Report;
