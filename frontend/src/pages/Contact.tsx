import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
 <div className="space-y-8 max-w-5xl mx-auto">
 <div>
 <h1 className="text-3xl font-extrabold font-heading text-text tracking-tight">Contact Administration</h1>
 <p className="text-sm text-textSecondary">Reach out to office operations for claiming support or escalations</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {/* Left column: Direct info */}
 <div className="space-y-6 md:col-span-1">
 <div className="glass-panel hero-warm-gradient rounded-xl p-6 space-y-6">
 <h3 className="text-lg font-bold font-heading text-text border-b border-primary/20 pb-2">Office Directory</h3>
 
 <div className="space-y-5">
 {offices.map((office) => (
 <div key={office.title} className="flex gap-3">
 <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-text h-10 w-10 flex items-center justify-center flex-shrink-0">
 <office.icon className="h-5 w-5" />
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/70">{office.title}</h4>
 <p className="text-sm text-primary font-medium mt-0.5">{office.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Right column: Query Form */}
 <div className="md:col-span-2">
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className="glass-panel hero-warm-gradient rounded-xl p-6 sm:p-8 space-y-6"
 >
 <h3 className="text-lg font-bold font-heading text-text border-b border-primary/20 pb-2">Send a Message</h3>

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
 <label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Your Name</label>
 <input
 type="text"
 required
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Enter your name"
 className="glass-input w-full"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Email Address</label>
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="Enter email address"
 className="glass-input w-full"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Subject</label>
 <input
 type="text"
 required
 value={subject}
 onChange={(e) => setSubject(e.target.value)}
 placeholder="What is this inquiry about?"
 className="glass-input w-full"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Message</label>
 <textarea
 required
 rows={5}
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 placeholder="Detail your inquiry, reference numbers, or claimed coordinates..."
 className="glass-input w-full resize-none"
 />
 </div>

 <button
 type="submit"
 disabled={sending}
 className="w-full py-3 rounded-xl btn-primary-custom shadow-lg shadow-primary/20 transition-all text-sm font-semibold flex items-center justify-center gap-2 text-white"
 >
 {sending ? (
 <>
 <div className="h-4 w-4 animate-spin rounded-xl border-2 border-white border-t-transparent"></div>
 <span>Sending Query...</span>
 </>
 ) : (
 <>
 <Send className="h-4 w-4" />
 <span>Send Message</span>
 </>
 )}
 </button>
 </form>
 </motion.div>
 </div>
 </div>
 </div>
 );
};

export default Contact;
