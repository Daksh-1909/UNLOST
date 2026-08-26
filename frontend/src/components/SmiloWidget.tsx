import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/* ══════════════════════════════════════════════════════ */
/* SOUND – Warm Bell Chimes */
/* ══════════════════════════════════════════════════════ */
const playChime = (type: 'click' | 'think' | 'happy') => {
 try {
 const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
 const master = ctx.createGain();
 const delay = ctx.createDelay(0.4);
 const dGain = ctx.createGain();
 delay.delayTime.value = 0.22;
 dGain.gain.value = 0.16;
 delay.connect(dGain); dGain.connect(master); master.connect(ctx.destination);
 const t = ctx.currentTime;

 const bell = (freq: number, start: number, vol: number, dur: number) => {
 const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
 o1.connect(g); o2.connect(g); g.connect(master); g.connect(delay);
 o1.type = 'sine'; o1.frequency.value = freq;
 o2.type = 'sine'; o2.frequency.value = freq * 2.756;
 const g2 = ctx.createGain(); o2.connect(g2); g2.gain.value = 0.1;
 g.gain.setValueAtTime(0, t + start);
 g.gain.linearRampToValueAtTime(vol, t + start + 0.012);
 g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
 o1.start(t + start); o1.stop(t + start + dur);
 o2.start(t + start); o2.stop(t + start + dur);
 };

 if (type === 'click') {
 [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.07, 0.16, 0.85));
 master.gain.setValueAtTime(0.7, t); master.gain.exponentialRampToValueAtTime(0.001, t + 1.05);
 } else if (type === 'happy') {
 [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.04, 0.1, 0.9));
 master.gain.setValueAtTime(0.6, t); master.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
 } else {
 bell(293.66, 0, 0.06, 0.8); bell(369.99, 0.1, 0.05, 0.7);
 master.gain.setValueAtTime(0.5, t); master.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
 }
 } catch (_) {}
};

/* ── Data ── */
const MSGS = ["Hi! I'm Smilo","Hello!","How can I help?","Let's explore UNLOST!","Ready to search!","UNLOST is ready","Beep boop~"];
const THINKS = ["Thinking...","Processing...","Analyzing...","Computing...","Loading AI..."];

interface Item {
 id: string;
 title: string;
 description: string;
 category: string;
 location: string;
 status: string;
 date: string;
 image_file: string | null;
}

interface Message {
 sender: 'user' | 'bot';
 text: string;
 timestamp: Date;
 items?: Item[];
}

/* ══════════════════════════════════════════════════════ */
/* SMILO ROBOT – Framer Motion driven */
/* ══════════════════════════════════════════════════════ */
const SmiloRobot: React.FC<{
 mouseX: number;
 mouseY: number;
 isWaving: boolean;
 isClicked: boolean;
 isHovered: boolean;
 isWavingHover: boolean;
 mood: string;
 hoverGreeting: string;
}> = ({ mouseX, mouseY, isWaving, isClicked, isHovered, isWavingHover, mood, hoverGreeting }) => {

 // Spring-smoothed mouse-driven head rotation
 const rotY = useSpring(useMotionValue(mouseX * 20), { stiffness: 60, damping: 18 });
 const rotX = useSpring(useMotionValue(-mouseY * 14), { stiffness: 60, damping: 18 });
 const rotZ = useSpring(useMotionValue(mouseX * 5), { stiffness: 50, damping: 20 });

 // Update springs on mouse change
 useEffect(() => {
 rotY.set(mouseX * 22);
 rotX.set(-mouseY * 14);
 rotZ.set(mouseX * 5);
 }, [mouseX, mouseY, rotY, rotX, rotZ]);

 // Read theme on render (updates often due to mouse events)
 const isDark = document.documentElement.classList.contains('dark');
 const themeColor = isDark ? '#a880ff' : '#5c321e';

 // Dynamic eye glow color by mood
 const eyeColor =
 mood === 'excited' ? '#facc15' :
 mood === 'thinking' ? '#67e8f9' : themeColor;

 const antOrb =
 mood === 'excited' ? '#facc15' :
 mood === 'thinking' ? '#67e8f9' : themeColor;

 return (
 <motion.div
 className="sm-root"
 animate={isWavingHover ? {
 y: [0, -3, 0],
 rotate: [0, 3, -3, 0]
 } : {
 y: 0,
 rotate: 0
 }}
 transition={isWavingHover ? {
 y: { duration: 0.9, repeat: 2, ease: 'easeInOut' },
 rotate: { duration: 1.8, ease: 'easeInOut' }
 } : {
 duration: 0.5, ease: [0.22, 1, 0.36, 1]
 }}
 style={{
 transform: isClicked ? 'scale(1.1)' : 'scale(1)',
 transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
 transformStyle: 'preserve-3d'
 }}
 >
 {/* Greeting Speech Bubble on hover */}
 <motion.div
 style={{
 position: 'absolute',
 top: '25px',
 left: '-58px', // positioned on the left side of the robot (viewer's left)
 background: 'rgba(15, 23, 42, 0.96)',
 border: '1px solid rgba(255, 255, 255, 0.12)',
 borderRadius: '12px 12px 2px 12px', // points to the robot on the right
 padding: '6px 12px',
 color: '#fff',
 fontSize: '11px',
 fontWeight: 600,
 fontFamily:"'Inter', sans-serif",
 whiteSpace: 'nowrap',
 boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
 zIndex: 20,
 pointerEvents: 'none'
 }}
 animate={isHovered ? {
 opacity: [0, 1, 1, 1, 0],
 scale: [0.6, 1.05, 1, 1, 0.6],
 x: [15, -2, 0, 0, -15],
 } : {
 opacity: 0,
 scale: 0.6,
 x: 15
 }}
 transition={{
 duration: 1.8,
 times: [0, 0.12, 0.2, 0.85, 1.0],
 ease: [0.22, 1, 0.36, 1]
 }}
 >
 {hoverGreeting}
 </motion.div>

 {/* ── ANTENNA (floats with head) ── */}
 <div className="sm-antenna-wrap">
 <motion.div
 className="sm-antenna-orb"
 animate={{
 scale: [1, 1.3, 1],
 boxShadow: [
 `0 0 10px ${antOrb}, 0 0 22px ${antOrb}88`,
 `0 0 15px ${antOrb}, 0 0 30px ${antOrb}bb`,
 `0 0 10px ${antOrb}, 0 0 22px ${antOrb}88`,
 ],
 }}
 transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
 style={{ background: `radial-gradient(circle at 35% 30%, #fff 0%, ${antOrb} 55%, ${antOrb}88 100%)` }}
 />
 <div className="sm-antenna-stem" />
 </div>

 {/* ── HEAD (mouse-driven 3-axis rotation) ── */}
 <motion.div
 className="sm-head"
 style={{
 rotateY: rotY,
 rotateX: rotX,
 rotateZ: rotZ,
 transformStyle: 'preserve-3d',
 transformPerspective: 320,
 }}
 animate={isWavingHover ? {
 y: [0, -5, 0],
 rotateY: [0, 8, 8, 0], // turns head slightly toward the user (looks left/forward)
 rotateZ: [0, 4, 4, 0] // head tilts slightly
 } : {
 y: [0, -5, 0],
 }}
 transition={isWavingHover ? {
 y: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
 rotateY: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
 rotateZ: { duration: 1.8, ease: [0.22, 1, 0.36, 1] }
 } : {
 y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
 }}
 >
 {/* Ears */}
 <div className="sm-ear sm-ear--l">
 {[0,1,2,3].map(i => <div key={i} className="sm-ear-slat" />)}
 </div>
 <div className="sm-ear sm-ear--r">
 {[0,1,2,3].map(i => <div key={i} className="sm-ear-slat" />)}
 </div>

 <div className="sm-head-shine" />
 <div className="sm-head-shine2" />

 {/* Visor */}
 <div className="sm-visor">
 <div className="sm-visor-shine" />
 <div className="sm-visor-scan" />

 <div className="sm-pixel-face">
 {/* Eyes — blink every 4s */}
 <motion.div
 className="sm-eyes"
 animate={{ scaleY: [1, 0.07, 1] }}
 transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.04, 0.09], ease: 'easeOut' }}
 >
 <motion.div
 className="sm-eye"
 style={{ background: isWavingHover ? '#67e8f9' : eyeColor, transition: 'background 0.35s ease' }}
 animate={{
 boxShadow: isWavingHover ? [
 `0 0 10px #67e8f9, 0 0 22px rgba(103, 232, 249, 0.8)`,
 `0 0 16px #67e8f9, 0 0 32px rgba(103, 232, 249, 1)`,
 `0 0 10px #67e8f9, 0 0 22px rgba(103, 232, 249, 0.8)`,
 ] : [
 `0 0 6px ${eyeColor}, 0 0 14px ${eyeColor}88`,
 `0 0 10px ${eyeColor}, 0 0 22px ${eyeColor}`,
 `0 0 6px ${eyeColor}, 0 0 14px ${eyeColor}88`,
 ]
 }}
 transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
 />
 <motion.div
 className="sm-eye"
 style={{ background: isWavingHover ? '#67e8f9' : eyeColor, transition: 'background 0.35s ease' }}
 animate={{
 boxShadow: isWavingHover ? [
 `0 0 10px #67e8f9, 0 0 22px rgba(103, 232, 249, 0.8)`,
 `0 0 16px #67e8f9, 0 0 32px rgba(103, 232, 249, 1)`,
 `0 0 10px #67e8f9, 0 0 22px rgba(103, 232, 249, 0.8)`,
 ] : [
 `0 0 6px ${eyeColor}, 0 0 14px ${eyeColor}88`,
 `0 0 10px ${eyeColor}, 0 0 22px ${eyeColor}`,
 `0 0 6px ${eyeColor}, 0 0 14px ${eyeColor}88`,
 ]
 }}
 transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
 />
 </motion.div>

 {/* Pixel smile — dynamic based on mood */}
 <div className="sm-smile" style={{ transition: 'transform 0.3s' }}>
 {mood === 'thinking' ? (
 <div className="sm-smile-row">
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 </div>
 ) : (
 <>
 <div className="sm-smile-row">
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 <span style={{ width: 4, height: 4 }} />
 <span style={{ width: 4, height: 4 }} />
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 </div>
 <div className="sm-smile-row" style={{ marginTop: -2 }}>
 <span style={{ width: 4, height: 4 }} />
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 <span className="px" style={{ width: 4, height: 4, background: eyeColor, boxShadow: `0 0 4px ${eyeColor}` }} />
 <span style={{ width: 4, height: 4 }} />
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 </motion.div>

 {/* ── NECK ── */}
 <div className="sm-neck" />

 {/* ── ACCENT RING ── */}
 <motion.div
 className="sm-accent-ring"
 animate={{
 boxShadow: [
 `0 0 10px ${eyeColor}88, 0 0 24px ${eyeColor}33`,
 `0 0 16px ${eyeColor}cc, 0 0 36px ${eyeColor}66`,
 `0 0 10px ${eyeColor}88, 0 0 24px ${eyeColor}33`,
 ],
 background: [
 `linear-gradient(90deg, transparent, ${eyeColor}cc, ${eyeColor}, ${eyeColor}cc, transparent)`,
 ],
 }}
 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
 />

 {/* ── TORSO + ARMS ── */}
 <motion.div
 className="sm-torso-wrap"
 animate={{ y: [0, -3, 0] }}
 transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
 >
 {/* LEFT ARM */}
 <motion.div
 className="sm-arm sm-arm--l"
 animate={
 isWaving
 ? { rotate: [0, 55, 10, 55, 15, 0] }
 : { rotate: [0, -9, 0, 9, 0] }
 }
 transition={
 isWaving
 ? { duration: 1.6, ease: 'easeInOut' }
 : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
 }
 style={{ transformOrigin: '80% 5%' }}
 >
 <div className="sm-arm-upper" />
 <div className="sm-arm-joint" />
 <div className="sm-arm-lower">
 <div className="sm-fingers">
 <div className="sm-finger" />
 <div className="sm-finger" />
 <div className="sm-finger" />
 </div>
 </div>
 </motion.div>

 {/* TORSO */}
 <div className="sm-torso">
 <div className="sm-torso-shine" />
 <div className="sm-ring sm-ring--top" />
 <div className="sm-ring sm-ring--bot" />
 <div className="sm-chest">
 <motion.div
 className="sm-chest-orb"
 animate={{
 boxShadow: [
 `0 0 6px ${eyeColor}, 0 0 14px ${eyeColor}88`,
 `0 0 16px ${eyeColor}, 0 0 32px ${eyeColor}`,
 `0 0 6px ${eyeColor}, 0 0 14px ${eyeColor}88`,
 ],
 background: eyeColor,
 }}
 transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
 />
 <div className="sm-chest-bars">
 <div style={{ width: '100%' }} />
 <div style={{ width: '70%' }} />
 <div style={{ width: '85%' }} />
 </div>
 </div>
 </div>

 {/* RIGHT ARM — waves on click */}
 <motion.div
 className="sm-arm sm-arm--r"
 animate={
 isWavingHover
 ? { rotate: [0, -65, -75, -50, -75, -50, -75, -50, 0] }
 : isWaving
 ? { rotate: [0, -55, -10, -55, -15, 0] }
 : { rotate: [0, 9, 0, -9, 0] }
 }
 transition={
 isWavingHover
 ? { duration: 1.8, ease: [0.22, 1, 0.36, 1] }
 : isWaving
 ? { duration: 1.6, ease: 'easeInOut' }
 : { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.28 }
 }
 style={{ transformOrigin: '20% 5%' }}
 >
 <div className="sm-arm-upper" />
 <div className="sm-arm-joint" />
 <div className="sm-arm-lower">
 <div className="sm-fingers">
 <div className="sm-finger" />
 <div className="sm-finger" />
 <div className="sm-finger" />
 </div>
 </div>
 </motion.div>
 </motion.div>

 {/* Ground glow shadow */}
 <div 
 className="sm-shadow" 
 style={{
 transform: `translateX(-50%) scale(${isHovered ? 0.75 : 1.0})`,
 opacity: isHovered ? 0.4 : 1.0,
 transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
 }}
 />
 </motion.div>
 );
};

/* ══════════════════════════════════════════════════════ */
/* WIDGET MAIN */
/* ══════════════════════════════════════════════════════ */
const SmiloWidget: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/assistant') return null;

 const messagesEndRef = useRef<HTMLDivElement>(null);
 const [mouseX, setMouseX] = useState(0);
 const [mouseY, setMouseY] = useState(0);
 const [isWaving, setIsWaving] = useState(false);
 const [isClicked, setIsClicked] = useState(false);
 const [isHovered, setIsHovered] = useState(false);
 const [isWavingHover, setIsWavingHover] = useState(false);
 const [hoverGreeting, setHoverGreeting] = useState("Hello!");

 const hoverTimeoutRef = useRef<any>(null);

 const HOVER_GREETINGS = ["Hello!","Need help?","Find something?"];

 const handleMouseEnter = () => {
 setIsHovered(true);
 setIsWavingHover(true);
 setHoverGreeting(HOVER_GREETINGS[Math.floor(Math.random() * HOVER_GREETINGS.length)]);
 if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
 hoverTimeoutRef.current = setTimeout(() => {
 setIsWavingHover(false);
 }, 1800);
 };

 const handleMouseLeave = () => {
 setIsHovered(false);
 setIsWavingHover(false);
 if (hoverTimeoutRef.current) {
 clearTimeout(hoverTimeoutRef.current);
 hoverTimeoutRef.current = null;
 }
 };

 useEffect(() => {
 return () => {
 if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
 };
 }, []);
  const [mood, setMood] = useState<'idle'|'thinking'|'happy'|'excited'>('idle');
  const [msgIndex, setMsgIndex] = useState(0);
  const [showMsg, setShowMsg] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkIdx, setThinkIdx] = useState(0);
 const [soundActive, setSoundActive] = useState(false);
 const [particles, setParticles] = useState<{id:number;angle:number;color:string;dist:number}[]>([]);
 const [clickCount, setClickCount] = useState(0);

 // Chat Panel State
 const [chatOpen, setChatOpen] = useState(false);
 const [messages, setMessages] = useState<Message[]>([
 { sender: 'bot', text:"Hi! I'm Smilo, your UNLOST assistant. Ask me anything about lost & found items or how to use the portal!", timestamp: new Date() }
 ]);
 const [inputValue, setInputValue] = useState('');
 const [botTyping, setBotTyping] = useState(false);

 // Global mouse position tracking relative to viewport
 useEffect(() => {
 const handleGlobalMouseMove = (e: MouseEvent) => {
 setMouseX((e.clientX / window.innerWidth - 0.5) * 2);
 setMouseY((e.clientY / window.innerHeight - 0.5) * 2);
 };
 window.addEventListener('mousemove', handleGlobalMouseMove);
 return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
 }, []);

 // Rotate thinking phrases
 useEffect(() => {
 const t = setInterval(() => setThinkIdx(p => (p + 1) % THINKS.length), 2100);
 return () => clearInterval(t);
 }, []);

 // Auto-scroll chat panel to bottom
 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 useEffect(() => {
 if (chatOpen) {
 scrollToBottom();
 }
 }, [messages, chatOpen, botTyping]);

 const spawnParticles = useCallback(() => {
 const cols = ['#86efac','#7dd3fc','#c4b5fd','#facc15','#f9a8d4','#ffffff'];
 const ps = Array.from({length:14},(_,i)=>({
 id: Date.now()+i,
 angle: (360/14)*i + Math.random()*18,
 color: cols[i % cols.length],
 dist: 36 + Math.random()*46,
 }));
 setParticles(ps);
 setTimeout(() => setParticles([]), 900);
 }, []);

 const getBotResponse = async (history: Message[], text: string): Promise<{ text: string; items?: Item[] }> => {
  try {
  const historyPayload = history.map(m => ({ sender: m.sender, text: m.text }));
  const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text, history: historyPayload })
  });
  const data = await response.json();
  if (response.ok && data.success && data.text) {
  return { text: data.text, items: data.items };
  }
  } catch (error) {
    console.error("Chat error:", error);
  }
  return { text: "Hi! I'm Smilo. Ask me about latest items, or check out the [Items](/items) and [Report](/report) pages!" };
 };

 const handleClick = () => {
 setClickCount(c => c + 1);
 playChime('happy');
 setSoundActive(true); 
 setTimeout(() => setSoundActive(false), 900);
 setIsClicked(true);
 setIsWaving(true);
 setMood('excited');
 setIsThinking(false);
 setMsgIndex(p => (p + 1) % MSGS.length);
 setShowMsg(true);
 spawnParticles();
 setChatOpen(true); // Open AI Chat panel on click
 
 setTimeout(() => setIsClicked(false), 280);
 setTimeout(() => { 
 setIsWaving(false); 
 setMood('thinking'); 
 setIsThinking(true); 
 }, 2200);
 setTimeout(() => setShowMsg(false), 4000);
 };

 const handleSendMessage = async (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!inputValue.trim()) return;

 const userText = inputValue;
 setInputValue('');
 
 // Add user message
 const newMessages = [...messages, { sender: 'user' as 'user' | 'bot', text: userText, timestamp: new Date() }];
 setMessages(newMessages);
 
 // Audio feed, waving, change mood to thinking
 playChime('think');
 setSoundActive(true);
 setTimeout(() => setSoundActive(false), 950);
 setMood('thinking');
 setBotTyping(true);
 setIsThinking(true);
 
 // Simulate thinking delay
 setTimeout(async () => {
 const response = await getBotResponse(newMessages, userText);
 setMessages(prev => [...prev, { 
 sender: 'bot', 
 text: response.text, 
 timestamp: new Date(),
 items: response.items 
 }]);
 setBotTyping(false);
 setIsThinking(false);
 setMood('happy');
 playChime('click');
 spawnParticles();
 }, 1200);
 };

 const parseMarkdownLinks = (text: string) => {
 const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
 const parts = [];
 let lastIndex = 0;
 let match;
 while ((match = regex.exec(text)) !== null) {
 if (match.index > lastIndex) {
 parts.push(text.substring(lastIndex, match.index));
 }
 parts.push(
 <a 
 key={match.index} 
 href={match[2]} 
 className="text-emerald-400 hover:underline hover:text-emerald-300 font-semibold"
 >
 {match[1]}
 </a>
 );
 lastIndex = regex.lastIndex;
 }
 if (lastIndex < text.length) {
 parts.push(text.substring(lastIndex));
 }
 return parts.length > 0 ? parts : text;
 };

 const acc = mood==='excited'?'#facc15': mood==='thinking'?'#67e8f9': mood==='happy'?'#4ade80':'#a3e635';

 return (
 <>
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
 
 /* Smilo Core Styles */
 .sm-root {
 position: relative;
 width: 110px;
 height: 125px;
 display: flex;
 flex-direction: column;
 align-items: center;
 transform-style: preserve-3d;
 }

 .sm-antenna-wrap {
 position: absolute;
 bottom: 100%;
 left: 50%;
 transform: translateX(-50%);
 display: flex;
 flex-direction: column;
 align-items: center;
 z-index: 10;
 pointer-events: none;
 }

 .sm-antenna-orb {
 width: 10px;
 height: 10px;
 border-radius: 50%;
 }

 .sm-antenna-stem {
 width: 2px;
 height: 10px;
 background: rgba(255, 255, 255, 0.4);
 }

 .sm-head {
 position: relative;
 width: 66px;
 height: 56px;
 background: rgba(255, 255, 255, 0.08);
 border: 1.5px solid rgba(255, 255, 255, 0.15);
 border-radius: 16px;
 box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.05), 0 8px 20px rgba(0, 0, 0, 0.4);
 backdrop-filter: blur(8px);
 display: flex;
 align-items: center;
 justify-content: center;
 transform-style: preserve-3d;
 z-index: 5;
 }

 .sm-ear {
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 width: 6px;
 height: 20px;
 background: rgba(255, 255, 255, 0.06);
 border: 1px solid rgba(255, 255, 255, 0.12);
 display: flex;
 flex-direction: column;
 justify-content: space-around;
 padding: 1px 0;
 }

 .sm-ear--l {
 right: 100%;
 margin-right: -1px;
 border-top-left-radius: 4px;
 border-bottom-left-radius: 4px;
 }

 .sm-ear--r {
 left: 100%;
 margin-left: -1px;
 border-top-right-radius: 4px;
 border-bottom-right-radius: 4px;
 }

 .sm-ear-slat {
 width: 3px;
 height: 1.5px;
 background: rgba(255, 255, 255, 0.2);
 margin: 0 auto;
 border-radius: 1px;
 }

 .sm-head-shine {
 position: absolute;
 top: 3px;
 left: 6px;
 right: 6px;
 height: 6px;
 background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
 border-radius: 6px;
 pointer-events: none;
 }

 .sm-head-shine2 {
 position: absolute;
 bottom: 3px;
 left: 6px;
 right: 6px;
 height: 3px;
 background: linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
 border-radius: 3px;
 pointer-events: none;
 }

 .sm-visor {
 position: relative;
 width: 52px;
 height: 38px;
 background: #0c0f1d;
 border: 1px solid rgba(255, 255, 255, 0.1);
 border-radius: 9px;
 box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.8), 0 0 3px rgba(0, 0, 0, 0.5);
 overflow: hidden;
 display: flex;
 align-items: center;
 justify-content: center;
 }

 .sm-visor-shine {
 position: absolute;
 top: 0;
 left: 0;
 right: 0;
 bottom: 0;
 background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
 pointer-events: none;
 }

 .sm-visor-scan {
 position: absolute;
 top: 0;
 left: 0;
 width: 100%;
 height: 1.5px;
 background: linear-gradient(90deg, transparent, rgba(134, 239, 172, 0.4), transparent);
 animation: sm-scan-line 3s linear infinite;
 pointer-events: none;
 }

 @keyframes sm-scan-line {
 0% { top: 0%; opacity: 0; }
 10% { opacity: 0.8; }
 90% { opacity: 0.8; }
 100% { top: 100%; opacity: 0; }
 }

 .sm-pixel-face {
 display: flex;
 flex-direction: column;
 align-items: center;
 justify-content: center;
 gap: 3px;
 z-index: 2;
 }

 .sm-eyes {
 display: flex;
 gap: 8px;
 justify-content: center;
 align-items: center;
 }

 .sm-eye {
 width: 6px;
 height: 6px;
 border-radius: 50%;
 }

 .sm-smile {
 display: flex;
 flex-direction: column;
 align-items: center;
 margin-top: 1px;
 }

 .sm-smile-row {
 display: flex;
 gap: 1px;
 justify-content: center;
 height: 3px;
 }

 .px {
 border-radius: 0.5px;
 display: inline-block;
 }

 .sm-neck {
 width: 11px;
 height: 6px;
 background: rgba(255, 255, 255, 0.12);
 border: 1.5px solid rgba(255, 255, 255, 0.2);
 border-top: none;
 border-bottom: none;
 z-index: 2;
 margin-top: -1px;
 }

 .sm-accent-ring {
 width: 38px;
 height: 3px;
 border-radius: 50%;
 z-index: 3;
 margin-top: -2px;
 pointer-events: none;
 }

 .sm-torso-wrap {
 position: relative;
 width: 80px;
 height: 56px;
 display: flex;
 justify-content: center;
 align-items: flex-start;
 z-index: 1;
 margin-top: -1px;
 }

 .sm-arm {
 position: absolute;
 top: 5px;
 width: 11px;
 height: 32px;
 display: flex;
 flex-direction: column;
 align-items: center;
 z-index: 2;
 }

 .sm-arm--l {
 left: 6px;
 }

 .sm-arm--r {
 right: 6px;
 }

 .sm-arm-upper {
 width: 6px;
 height: 12px;
 background: rgba(255, 255, 255, 0.1);
 border: 1px solid rgba(255, 255, 255, 0.15);
 border-radius: 3px;
 }

 .sm-arm-joint {
 width: 5px;
 height: 5px;
 background: rgba(255, 255, 255, 0.2);
 border-radius: 50%;
 margin: -2px 0;
 z-index: 2;
 }

 .sm-arm-lower {
 width: 6px;
 height: 12px;
 background: rgba(255, 255, 255, 0.08);
 border: 1px solid rgba(255, 255, 255, 0.12);
 border-radius: 3px;
 display: flex;
 flex-direction: column;
 align-items: center;
 justify-content: flex-end;
 }

 .sm-fingers {
 display: flex;
 gap: 0.5px;
 justify-content: center;
 width: 100%;
 padding-bottom: 1px;
 }

 .sm-finger {
 width: 1px;
 height: 2.5px;
 background: rgba(255, 255, 255, 0.3);
 border-radius: 0.5px;
 }

 .sm-torso {
 position: relative;
 width: 48px;
 height: 44px;
 background: rgba(255, 255, 255, 0.08);
 border: 1.5px solid rgba(255, 255, 255, 0.15);
 border-radius: 11px 11px 13px 13px;
 box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.04), 0 6px 16px rgba(0,0,0,0.4);
 overflow: hidden;
 backdrop-filter: blur(8px);
 display: flex;
 flex-direction: column;
 align-items: center;
 justify-content: center;
 z-index: 3;
 }

 .sm-torso-shine {
 position: absolute;
 top: 2px;
 left: 4px;
 right: 4px;
 height: 5px;
 background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%);
 border-radius: 4px;
 }

 .sm-ring {
 position: absolute;
 left: 0;
 right: 0;
 height: 1px;
 background: rgba(255, 255, 255, 0.06);
 }

 .sm-ring--top {
 top: 11px;
 }

 .sm-ring--bot {
 bottom: 11px;
 }

 .sm-chest {
 display: flex;
 align-items: center;
 gap: 4px;
 margin-top: 4px;
 z-index: 2;
 width: 100%;
 justify-content: center;
 padding: 0 6px;
 }

 .sm-chest-orb {
 width: 8px;
 height: 8px;
 border-radius: 50%;
 }

 .sm-chest-bars {
 display: flex;
 flex-direction: column;
 gap: 1.5px;
 width: 16px;
 align-items: flex-start;
 }

 .sm-chest-bars > div {
 height: 1.5px;
 background: rgba(255, 255, 255, 0.3);
 border-radius: 0.5px;
 }

 .sm-shadow {
 position: absolute;
 bottom: -6px;
 left: 50%;
 transform: translateX(-50%);
 width: 54px;
 height: 5px;
 background: radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%);
 border-radius: 50%;
 pointer-events: none;
 z-index: 0;
 }

 /* Keyframes and Animations */
 @keyframes sm-think-bbl { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
 @keyframes sm-spin{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
 @keyframes sm-dot { 0%,100%{transform:translateY(0);opacity:0.28} 50%{transform:translateY(-5px);opacity:1} }
 @keyframes sm-ring-out { 0%{transform:scale(1);opacity:0.65} 100%{transform:scale(3.4);opacity:0} }
 @keyframes sm-particle { 0%{transform:translate(0,0) scale(1.1);opacity:1} 100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0} }
 @keyframes sm-wbar { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.25)} }

 @keyframes sm-reflection-sweep {
 0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
 10% { opacity: 0.25; }
 30% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
 100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
 }

 .sm-widget-container {
 position: fixed;
 bottom: 24px;
 right: 24px;
 z-index: 9999;
 display: flex;
 flex-direction: column;
 align-items: flex-end;
 gap: 8px;
 font-family: 'Inter', sans-serif;
 }
 @media (max-width: 768px) {
 .sm-widget-container {
 bottom: 16px;
 right: 16px;
 }
 }
 `}</style>

 <motion.div
 initial={{ opacity: 0, scale: 0.4, y: 50 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 transition={{ delay: 0.5, duration: 0.6, ease: [0.34,1.56,0.64,1] }}
 className="sm-widget-container"
 >
 {/* ── CHAT PANEL ── */}
 {chatOpen && (
 <div style={{
 width: '330px',
 height: '420px',
 background: 'rgba(15, 23, 42, 0.95)',
 border: '1px solid rgba(255, 255, 255, 0.1)',
 backdropFilter: 'blur(16px)',
 borderRadius: '16px',
 boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
 display: 'flex',
 flexDirection: 'column',
 overflow: 'hidden',
 marginBottom: '10px'
 }}>
 {/* Header */}
 <div style={{
 display: 'flex',
 alignItems: 'center',
 padding: '12px 16px',
 borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
 background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))',
 width: '100%',
 justifyContent: 'space-between'
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
 <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>SMILO ASSISTANT</span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center' }}>
 <button 
 onClick={() => window.location.href = '/assistant'}
 style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', marginRight: '12px' }}
 title="Open full screen"
 >
 ⛶
 </button>
 <button 
 onClick={() => setChatOpen(false)} 
 style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}
 title="Close"
 >
 ✕
 </button>
 </div>
 </div>

 {/* Message list */}
 <div style={{
 flex: 1,
 padding: '16px',
 overflowY: 'auto',
 display: 'flex',
 flexDirection: 'column',
 gap: '12px',
 scrollBehavior: 'smooth'
 }}>
 {messages.map((msg, i) => (
 <div 
 key={i} 
 style={{ 
 display: 'flex', 
 justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
 width: '100%'
 }}
 >
 <div style={{
 maxWidth: '85%',
 padding: '10px 14px',
 borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
 background: msg.sender === 'user' 
 ? 'linear-gradient(135deg, #6366f1, #a855f7)' 
 : 'rgba(255, 255, 255, 0.04)',
 border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
 color: '#f8fafc',
 fontSize: '12px',
 lineHeight: '1.5',
 whiteSpace: 'pre-line'
 }}>
 {msg.sender === 'bot' ? parseMarkdownLinks(msg.text) : msg.text}


 </div>
 </div>
 ))}

 {/* Typing Indicator */}
 {botTyping && (
 <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
 <div style={{
 padding: '10px 14px',
 borderRadius: '14px 14px 14px 2px',
 background: 'rgba(255, 255, 255, 0.04)',
 border: '1px solid rgba(255, 255, 255, 0.08)',
 display: 'flex',
 gap: '4px',
 alignItems: 'center'
 }}>
 {[0,1,2].map((idx) => (
 <div 
 key={idx} 
 style={{ 
 width: '4px', 
 height: '4px', 
 borderRadius: '50%', 
 background: '#67e8f9', 
 animation: 'sm-dot 1s ease-in-out infinite', 
 animationDelay: `${idx * 0.18}s` 
 }} 
 />
 ))}
 </div>
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>

 {/* Quick suggestions */}
 <div style={{
 padding: '8px 12px 0 12px',
 display: 'flex',
 gap: '6px',
 overflowX: 'auto',
 whiteSpace: 'nowrap',
 scrollbarWidth: 'none'
 }}>
 {[
 { label: 'Latest Items', query: 'Show latest items' },
 { label: 'Report Item', query: 'How to report an item' },
 { label: 'Claiming', query: 'How to claim an item' }
 ].map((s, i) => (
 <button
 key={i}
 onClick={() => {
 setInputValue(s.query);
 // Auto-focus and send in next event loop
 setTimeout(() => handleSendMessage(), 50);
 }}
 style={{
 fontSize: '10px',
 padding: '4px 10px',
 borderRadius: '999px',
 background: 'rgba(255, 255, 255, 0.05)',
 border: '1px solid rgba(255, 255, 255, 0.1)',
 color: '#cbd5e1',
 cursor: 'pointer',
 transition: 'background 0.2s',
 outline: 'none'
 }}
 onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
 onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
 >
 {s.label}
 </button>
 ))}
 </div>

 {/* Form */}
 <form 
 onSubmit={handleSendMessage} 
 style={{
 display: 'flex',
 padding: '12px',
 borderTop: '1px solid rgba(255, 255, 255, 0.08)',
 gap: '8px'
 }}
 >
 <input 
 type="text"
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 placeholder="Ask Smilo..."
 style={{
 flex: 1,
 background: 'rgba(0, 0, 0, 0.3)',
 border: '1px solid rgba(255, 255, 255, 0.1)',
 borderRadius: '8px',
 padding: '8px 12px',
 fontSize: '12px',
 color: '#f8fafc',
 outline: 'none'
 }}
 />
 <button
 type="submit"
 style={{
 background: 'linear-gradient(135deg, #6366f1, #a855f7)',
 border: 'none',
 borderRadius: '8px',
 width: '32px',
 height: '32px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 color: '#fff',
 fontSize: '12px'
 }}
 >
 ➔
 </button>
 </form>
 </div>
 )}

 {/* Thinking bubble — always on by default when panel closed */}
 {isThinking && !showMsg && !chatOpen && (
 <div style={{padding:'6px 12px',borderRadius:'10px 10px 3px 10px',background:'rgba(6,8,22,0.92)',border:`1px solid ${acc}33`,backdropFilter:'blur(14px)',boxShadow:'0 4px 15px rgba(0,0,0,0.45)',animation:'sm-think-bbl 0.3s ease-out both',display:'flex',alignItems:'center',gap:6}}>
 <div style={{fontSize:11,animation:'sm-spin 1.6s linear infinite',display:'inline-block'}}>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
 </div>
 <span style={{fontSize:10,color:`${acc}cc`,fontWeight:600,letterSpacing:'0.05em'}}>{THINKS[thinkIdx]}</span>
 <div style={{display:'flex',gap:2}}>
 {[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:'50%',background:acc,boxShadow:`0 0 4px ${acc}`,animation:'sm-dot 1s ease-in-out infinite',animationDelay:`${i*0.18}s`}} />)}
 </div>
 </div>
 )}

 {/* Chat message */}
 {showMsg && !chatOpen && (
 <div style={{padding:'8px 12px',borderRadius:'11px 11px 3px 11px',background:'rgba(6,8,22,0.96)',border:`1px solid ${acc}44`,backdropFilter:'blur(16px)',color:'#fff',fontSize:11.5,fontWeight:600,whiteSpace:'nowrap',boxShadow:'0 6px 20px rgba(0,0,0,0.5)',animation:'sm-msg 0.3s ease-out both'}}>
 {MSGS[msgIndex]}
 </div>
 )}

 {/* Soundwave bars */}
 {soundActive && (
 <div style={{display:'flex',alignItems:'center',gap:3,justifyContent:'flex-end'}}>
 <span style={{fontSize:8,color:`${acc}88`}}>♪</span>
 <div style={{display:'flex',alignItems:'center',gap:2,height:15}}>
 {[4,7,11,14,11,8,12,9,5,10,13,8,4].map((h,i)=>(
 <div key={i} style={{width:2,height:h,borderRadius:1,background:`linear-gradient(180deg,${acc},${acc}66)`,boxShadow:`0 0 3px ${acc}88`,animation:'sm-wbar 0.55s ease-in-out infinite',animationDelay:`${i*0.04}s` as any}} />
 ))}
 </div>
 <span style={{fontSize:8,color:`${acc}88`}}>♪</span>
 </div>
 )}

 {/* Click rings */}
 {isClicked && [0,1].map(i=>(
 <div key={i} style={{position:'absolute',bottom:60,right:35,width:70,height:70,borderRadius:'50%',border:`1.5px solid ${acc}88`,animation:'sm-ring-out 0.75s ease-out forwards',animationDelay:`${i*0.18}s`,pointerEvents:'none'}} />
 ))}

 {/* Particles */}
 <div style={{position:'absolute',bottom:80,right:42,pointerEvents:'none',width:0,height:0}}>
 {particles.map(p=>{
 const rad=(p.angle*Math.PI)/180;
 return <div key={p.id} style={{position:'absolute',width:5,height:5,borderRadius:'50%',background:p.color,boxShadow:`0 0 6px ${p.color}`,'--tx':`${Math.cos(rad)*p.dist}px`,'--ty':`${-Math.sin(rad)*p.dist}px`,animation:'sm-particle 0.75s ease-out forwards'} as React.CSSProperties} />;
 })}
 </div>

 {/* ── THE ROBOT ── */}
 <button
 onClick={handleClick}
 onMouseEnter={handleMouseEnter}
 onMouseLeave={handleMouseLeave}
 style={{background:'transparent',border:'none',cursor:'pointer',padding:0,outline:'none',WebkitTapHighlightColor:'transparent'}}
 title="Click Smilo!"
 >
 <SmiloRobot
 mouseX={mouseX}
 mouseY={mouseY}
 isWaving={isWaving}
 isClicked={isClicked}
 isHovered={isHovered}
 isWavingHover={isWavingHover}
 mood={mood}
 hoverGreeting={hoverGreeting}
 />
 {/* Label */}
 <div style={{textAlign:'center',marginTop:4,fontFamily:"'Orbitron',sans-serif",fontSize:8,fontWeight:900,letterSpacing:'0.2em',color:'rgba(255,255,255,0.88)',textShadow:`0 0 8px ${acc}99,0 0 16px ${acc}44`,background:'rgba(255,255,255,0.02)',border:`1px solid ${acc}28`,borderRadius:4,padding:'3px 10px',backdropFilter:'blur(8px)',transition:'border-color 0.3s'}}>
 SMILO
 </div>
 </button>

 {clickCount > 0 && !chatOpen && (
 <div style={{textAlign:'center',fontSize:8,color:'rgba(134,239,172,0.3)',letterSpacing:'0.1em',fontFamily:'monospace'}}>
 × {clickCount} clicks
 </div>
 )}
 </motion.div>
 </>
 );
};

export default SmiloWidget;
