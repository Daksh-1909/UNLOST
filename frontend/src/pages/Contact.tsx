import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, buttonHoverVariants, staggerContainer, staggerItem } from '../utils/animations';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setSending(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmitted(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert(data.message || 'Failed to send message.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Network error, please try again later.');
    } finally {
      setSending(false);
    }
  };

  const offices = [
    { title: 'Main Office', desc: 'Student Center, Room 102', icon: MapPin },
    { title: 'Support Email', desc: 'unlost_support@campus.edu', icon: Mail },
    { title: 'Emergency Phone', desc: '+1 (555) 902-1234', icon: Phone },
    { title: 'Hours of Operation', desc: 'Mon - Fri, 8:00 AM - 5:00 PM', icon: Clock },
  ];

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8 max-w-5xl mx-auto"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-3xl font-extrabold font-heading text-text tracking-tight">Contact Administration</h1>
        <p className="text-sm text-textSecondary">Reach out to office operations for claiming support or escalations</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Direct info */}
        <div className="space-y-6 md:col-span-1">
          <motion.div variants={staggerItem} className="glass-panel rounded-xl p-6 space-y-6 bg-surface/20 border border-text/15">
            <h3 className="text-lg font-bold font-heading text-text border-b border-text/15 pb-2">Office Directory</h3>
            
            <motion.div 
              variants={staggerContainer} initial="hidden" animate="visible"
              className="space-y-5"
            >
              {offices.map((office) => (
                <motion.div variants={staggerItem} key={office.title} className="flex gap-3">
                  <div className="p-2.5 rounded-xl bg-transparent border border-text/15 text-text h-10 w-10 flex items-center justify-center flex-shrink-0">
                    <office.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary">{office.title}</h4>
                    <p className="text-sm text-text font-medium mt-0.5">{office.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Right column: Query Form */}
        <motion.div variants={staggerItem} className="md:col-span-2">
          <div className="glass-panel rounded-xl p-6 sm:p-8 space-y-6 bg-surface/20 border border-text/15">
            <h3 className="text-lg font-bold font-heading text-text border-b border-text/15 pb-2">Send a Message</h3>

            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-success/10 border border-success/20 text-success text-sm rounded-xl flex items-center gap-2.5"
                >
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Message Sent Successfully! We will get back to you within 24 hours.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-3 rounded-xl bg-transparent border border-text/15 text-sm text-text focus:outline-none focus:border-text/40 focus:bg-primary/5 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full p-3 rounded-xl bg-transparent border border-text/15 text-sm text-text focus:outline-none focus:border-text/40 focus:bg-primary/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this inquiry about?"
                  className="w-full p-3 rounded-xl bg-transparent border border-text/15 text-sm text-text focus:outline-none focus:border-text/40 focus:bg-primary/5 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your inquiry, reference numbers, or claimed coordinates..."
                  className="w-full p-3 rounded-xl bg-transparent border border-text/15 text-sm text-text focus:outline-none focus:border-text/40 focus:bg-primary/5 transition-all resize-none"
                />
              </div>

              <motion.button
                type="submit"
                disabled={sending}
                variants={buttonHoverVariants}
                whileHover={!sending ? "hover" : ""}
                whileTap={!sending ? "tap" : ""}
                className="w-full py-3 rounded-xl bg-primary dark:bg-gradient-to-r dark:from-pink-500 dark:to-purple-500 shadow-lg shadow-primary/20 transition-all duration-200 ease-out hover:scale-[1.02] disabled:opacity-80 disabled:hover:scale-100 text-sm font-semibold flex items-center justify-center gap-2 text-white"
              >
                {sending ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-4 w-4 rounded-xl border-2 border-white/30 border-t-white"
                    />
                    <span>Sending Query...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Message</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Contact;
