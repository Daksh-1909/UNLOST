import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
 Search, PlusCircle, Calendar, MapPin, Tag, ChevronRight, Eye, Bookmark, 
 Share2, Smartphone, Watch, Backpack, Key, Wallet, Map, 
 Activity, Clock, ChevronLeft, PhoneCall, 
 Shield, X, AlertCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tapHoverVariants, buttonHoverVariants, scrollRevealVariants, scrollRevealViewport, staggerContainer, staggerItem } from '../utils/animations';
import AmbientGlowBg from '../components/AmbientGlowBg';

interface Item {
 id: string;
 title: string;
 description: string;
 category: string;
 location: string;
 status: 'Lost' | 'Found' | 'Claimed' | 'Archived';
 date: string;
 reporter_email: string;
 image_file: string | null;
 security_question?: string;
 isMock?: boolean;
}


// Stats upward counter animation helper
const AnimatedCounter: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
 const [count, setCount] = useState(0);

 useEffect(() => {
 let start = 0;
 const end = value;
 if (start === end) return;

 const duration = 1.6;
 const totalMiliseconds = duration * 1000;
 const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 12);
 
 const timer = setInterval(() => {
 start += 1;
 setCount(start);
 if (start === end) {
 clearInterval(timer);
 }
 }, incrementTime);

 return () => clearInterval(timer);
 }, [value]);

 return <span className="font-extrabold text-2xl sm:text-3xl text-primary tracking-tight">{count}{suffix}</span>;
};

// Vector SVGs category generator for placeholder images
const CategoryImageFallback: React.FC<{ category: string }> = ({ category }) => {
 const cat = category.toLowerCase();
 let grad = 'from-secondary/20 to-primary/20';
 let iconColor = 'text-primary';
 let Icon = Tag;

 if (cat.includes('elect')) {
 grad = 'from-secondary/25 to-primary/20';
 iconColor = 'text-primary';
 Icon = Smartphone;
 } else if (cat.includes('wall')) {
 grad = 'from-accent/30 to-secondary/20';
 iconColor = 'text-secondary';
 Icon = Wallet;
 } else if (cat.includes('key')) {
 grad = 'from-primary/25 to-secondary/20';
 iconColor = 'text-primary';
 Icon = Key;
 } else if (cat.includes('bag')) {
 grad = 'from-secondary/25 to-accent/20';
 iconColor = 'text-secondary';
 Icon = Backpack;
 } else if (cat.includes('doc')) {
 grad = 'from-primary/20 to-accent/20';
 iconColor = 'text-primary';
 Icon = Shield;
 } else if (cat.includes('cloth')) {
 grad = 'from-accent/25 to-shade-5/30';
 iconColor = 'text-secondary';
 Icon = Tag;
 } else if (cat.includes('access')) {
 grad = 'from-secondary/20 to-accent/20';
 iconColor = 'text-primary';
 Icon = Watch;
 }

 return (
 <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center relative overflow-hidden`}>
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(92,50,30,0.06)_0%,transparent_70%)]" />
 <div className="absolute top-4 left-6 w-2 h-2 rounded-xl bg-primary/5 blur-xs" />
 <div className="absolute bottom-6 right-8 w-3.5 h-3.5 rounded-xl bg-primary/5 blur-xs" />
 <Icon className={`w-14 h-14 ${iconColor} drop-shadow-[0_0_8px_rgba(92,50,30,0.15)] group-hover:scale-110 transition-transform duration-500`} />
 </div>
 );
};

const Home: React.FC = () => {
 // State management
 const [, setDbItems] = useState<Item[]>([]);
 const [allItems, setAllItems] = useState<Item[]>([]);
 const [filteredItems, setFilteredItems] = useState<Item[]>([]);
 const [loading, setLoading] = useState(true);
 
 // Filters state
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCategory, setSelectedCategory] = useState<string>('All');
 const [selectedStatus, setSelectedStatus] = useState<string>('All');
 const [selectedLocation, setSelectedLocation] = useState<string>('All');
 const [selectedDate, setSelectedDate] = useState<string>('All');
 
 // Custom Interactive features
 const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
 const [selectedItemModal, setSelectedItemModal] = useState<Item | null>(null);
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 
 // Map Pin Selection State
 const [hoveredMapPin, setHoveredMapPin] = useState<Item | null>(null);
 const [activeMapPin, setActiveMapPin] = useState<Item | null>(null);

 // Carousel ref
 const carouselRef = useRef<HTMLDivElement>(null);

 // Fetch database items
 useEffect(() => {
 const fetchItems = async () => {
 try {
 const response = await fetch('/api/items?limit=10');
 const data = await response.json();
 if (response.ok && data.success) {
 setDbItems(data.items);
 setAllItems(data.items);
 setFilteredItems(data.items);
 } else {
 setAllItems([]);
 setFilteredItems([]);
 }
 } catch (error) {
 console.error('Error loading latest items:', error);
 setAllItems([]);
 setFilteredItems([]);
 } finally {
 setLoading(false);
 }
 };
 fetchItems();
 }, []);

 // Lock body scroll when modal is open
 useEffect(() => {
 if (selectedItemModal) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'auto';
 }
 return () => {
 document.body.style.overflow = 'auto';
 };
 }, [selectedItemModal]);

 // Filter application trigger
 useEffect(() => {
 let result = allItems;

 // Search query matching
 if (searchQuery.trim() !== '') {
 const q = searchQuery.toLowerCase();
 result = result.filter(item => 
 item.title.toLowerCase().includes(q) || 
 item.description.toLowerCase().includes(q) ||
 item.location.toLowerCase().includes(q)
 );
 }

 // Category filter
 if (selectedCategory !== 'All') {
 result = result.filter(item => item.category === selectedCategory);
 }

 // Status filter
 if (selectedStatus !== 'All') {
 result = result.filter(item => item.status === selectedStatus);
 }

 // Location filter
 if (selectedLocation !== 'All') {
 result = result.filter(item => item.location.includes(selectedLocation));
 }

 // Date range filter
 if (selectedDate !== 'All') {
 const today = new Date('2026-07-11'); // Local mockup reference date
 result = result.filter(item => {
 const itemDate = new Date(item.date);
 const diffTime = Math.abs(today.getTime() - itemDate.getTime());
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 
 if (selectedDate === 'Today') return diffDays <= 1;
 if (selectedDate === 'Week') return diffDays <= 7;
 if (selectedDate === 'Month') return diffDays <= 30;
 return true;
 });
 }

 setFilteredItems(result);
 }, [searchQuery, selectedCategory, selectedStatus, selectedLocation, selectedDate, allItems]);

 // Toast notifier helper
 const triggerToast = (msg: string) => {
 setToastMessage(msg);
 setTimeout(() => setToastMessage(null), 3000);
 };

 // Bookmark toggle operation
 const toggleBookmark = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 e.preventDefault();
 if (bookmarkedIds.includes(id)) {
 setBookmarkedIds(bookmarkedIds.filter(bId => bId !== id));
 triggerToast('Removed item from bookmarks');
 } else {
 setBookmarkedIds([...bookmarkedIds, id]);
 triggerToast('Added item to bookmarks');
 }
 };

 // Clipboard share item helper
 const handleShareItem = (item: Item, e: React.MouseEvent) => {
 e.stopPropagation();
 e.preventDefault();
 const mockLink = `${window.location.origin}/items?id=${item.id}`;
 navigator.clipboard.writeText(mockLink);
 triggerToast(`Copied details link to clipboard!`);
 };

 const formatDate = (dateStr: string) => {
 const date = new Date(dateStr);
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
 };

 // Carousel slider operations
 const scrollCarousel = (dir: 'left' | 'right') => {
 if (carouselRef.current) {
 const scrollAmt = 320;
 carouselRef.current.scrollBy({
 left: dir === 'left' ? -scrollAmt : scrollAmt,
 behavior: 'smooth'
 });
 }
 };

 // Filter unique locations for options dropdown selector
 const locationOptions = Array.from(new Set(allItems.map(item => {
 const loc = item.location;
 if (loc.includes('Library')) return 'Library';
 if (loc.includes('Student Center') || loc.includes('Student Union')) return 'Student Center';
 if (loc.includes('Science') || loc.includes('Chemistry')) return 'Science Building';
 if (loc.includes('Gym') || loc.includes('Sports')) return 'Gymnasium';
 if (loc.includes('Arts')) return 'Art Complex';
 return null;
 }).filter(Boolean))) as string[];

 // Statistics counters numbers
 const lostItemsCount = allItems.filter(i => i.status === 'Lost').length;
 const foundItemsCount = allItems.filter(i => i.status === 'Found').length;
 const returnedItemsCount = allItems.filter(i => i.status === 'Claimed').length;
 const totalItems = allItems.length;
 const returnedPercentage = totalItems > 0 ? Math.round((returnedItemsCount / totalItems) * 100) : 0;
 
 const statsList = [
 { title: 'Lost Items', value: lostItemsCount, suffix: '', labelColor: 'text-secondary', glow: 'rgba(92,50,30,0.04)' },
 { title: 'Found Items', value: foundItemsCount, suffix: '', labelColor: 'text-secondary', glow: 'rgba(92,50,30,0.04)' },
 { title: 'Returned', value: returnedPercentage, suffix: '%', labelColor: 'text-secondary', glow: 'rgba(92,50,30,0.04)' },
 { title: 'Active Reports', value: lostItemsCount + foundItemsCount, suffix: '', labelColor: 'text-secondary', glow: 'rgba(92,50,30,0.04)' }
 ];

 // Dynamic Map Hotspots based on current items
 const getMapHotspots = () => {
 const locations = [
 { key: 'Library', x: 130, y: 150 },
 { key: 'Student Center', x: 260, y: 190 },
 { key: 'Cafeteria', x: 260, y: 190 },
 { key: 'Science', x: 190, y: 80 },
 { key: 'Chemistry', x: 190, y: 80 },
 { key: 'Gym', x: 70, y: 240 },
 { key: 'Parking', x: 340, y: 100 }
 ];
 
 const hotspots: { x: number, y: number, itemRef: string }[] = [];
 const usedItems = new Set<string>();
 
 for (const loc of locations) {
 const item = allItems.find(i => 
 i.location.toLowerCase().includes(loc.key.toLowerCase()) && 
 !usedItems.has(i.id) &&
 i.status !== 'Claimed'
 );
 if (item) {
 hotspots.push({ x: loc.x, y: loc.y, itemRef: item.id });
 usedItems.add(item.id);
 }
 }
 return hotspots.slice(0, 5);
 };
 const dynamicMapHotspots = getMapHotspots();

 return (
 <AmbientGlowBg>
 <div className="space-y-10 relative pb-16">
 
 {/* Toast Notification */}
 <AnimatePresence>
 {toastMessage && (
 <motion.div 
 initial={{ opacity: 0, y: -40, scale: 0.9 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -20, scale: 0.9 }}
 className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3 rounded-xl bg-shade-5/90 border border-primary/30 text-text font-semibold shadow-lg backdrop-blur-md flex items-center gap-2"
 >
 <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
 <span className="text-xs sm:text-sm">{toastMessage}</span>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Decorative Parallax / Glowing background blobs */}

 

 {/* ── HERO SECTION ── */}
 <motion.section variants={scrollRevealVariants} initial="hidden" whileInView="visible" viewport={scrollRevealViewport} className="relative glass-panel rounded-xl p-8 sm:p-12 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
 <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-xl blur-3xl pointer-events-none"></div>
 
 {/* Floating abstract accent shapes */}
 
 

 {/* Floating Lost & Found Item Particles */}
 <motion.div
 animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [0, 15, -5, 0] }}
 transition={{ duration: 7, repeat: Infinity, ease:"easeInOut" }}
 className="absolute top-[12%] left-[8%] text-primary pointer-events-none z-0"
 >
 <Key className="w-8 h-8" />
 </motion.div>
 
 <motion.div
 animate={{ y: [0, 25, 0], x: [0, -15, 0], rotate: [0, -20, 10, 0] }}
 transition={{ duration: 9, repeat: Infinity, ease:"easeInOut", delay: 1 }}
 className="absolute bottom-[18%] right-[35%] text-secondary pointer-events-none z-0"
 >
 <Wallet className="w-12 h-12" />
 </motion.div>

 <motion.div
 animate={{ y: [0, -30, 0], x: [0, -10, 0], rotate: [0, 25, 0] }}
 transition={{ duration: 8, repeat: Infinity, ease:"easeInOut", delay: 2.5 }}
 className="absolute top-[25%] right-[10%] text-accent pointer-events-none z-0"
 >
 <Smartphone className="w-14 h-14" />
 </motion.div>

 <motion.div
 animate={{ y: [0, 15, 0], x: [0, 20, 0], rotate: [0, -15, 0] }}
 transition={{ duration: 10, repeat: Infinity, ease:"easeInOut", delay: 0.5 }}
 className="absolute bottom-[25%] left-[25%] text-primary/15 pointer-events-none z-0"
 >
 <Watch className="w-10 h-10" />
 </motion.div>
 
 <motion.div
 animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
 transition={{ duration: 12, repeat: Infinity, ease:"easeInOut", delay: 1.5 }}
 className="absolute top-[5%] right-[45%] text-secondary pointer-events-none z-0"
 >
 <Backpack className="w-16 h-16" />
 </motion.div>

 <div className="space-y-6 max-w-2xl text-center lg:text-left z-10">
 <motion.div 
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-text text-xs font-bold"
 >
 <Activity className="w-3.5 h-3.5 animate-pulse" />
 <span>PORTAL ACTIVE</span>
 </motion.div>
 
 <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight text-text leading-tight">
 Lost & Found <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Portal</span>
 </h1>
 
 <p className="text-sm sm:text-base text-textSecondary font-semibold leading-relaxed">
 Centralized intelligent hub to recover missing essentials. Browse reported catalog items, pin locations on map trackers, or list found objects with secure checks.
 </p>

 <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
 <Link
 to="/report"
 className="px-6 py-3.5 rounded-xl bg-primary dark:bg-gradient-to-r dark:from-pink-500 dark:to-purple-500 text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:brightness-110 shadow-md text-xs sm:text-sm font-bold flex items-center gap-2"
 >
 <PlusCircle className="w-4 h-4 text-white/80 transition-transform duration-300 transform group-hover:scale-110" />
 <span>Report a Lost Item</span>
 </Link>
 <Link
 to="/items"
 className="px-6 py-3.5 rounded-xl btn-secondary-custom text-xs sm:text-sm font-bold flex items-center gap-2"
 >
 <Search className="w-4 h-4 text-textSecondary transition-transform duration-300 transform group-hover:scale-110" />
 <span>Search for Found Items</span>
 </Link>
 </div>
 </div>

 {/* Animated illustration of floating objects */}
 <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center z-10 overflow-visible">
 <div className="absolute inset-0 bg-secondary/15 rounded-xl blur-3xl filter animate-pulse"></div>
 
 {/* Central Radar Ring */}
 <div className="absolute w-44 h-44 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '4s' }} />
 <div className="absolute w-28 h-28 rounded-full border border-primary/20 flex items-center justify-center bg-surface/80 backdrop-blur-md animate-float">
 <Search className="w-10 h-10 text-primary" />
 </div>

 {/* Floating object SVGs / Lucide items */}
 <motion.div 
 animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
 transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
 className="absolute top-6 left-6 p-3 !rounded-full glass-card shadow-md text-primary"
 >
 <Key className="w-6 h-6 transition-all duration-300 transform hover:scale-110 hover:text-accent text-primary" />
 </motion.div>

 <motion.div 
 animate={{ y: [0, 12, 0], rotate: [0, -6, 0] }}
 transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
 className="absolute top-10 right-6 p-3 !rounded-full glass-card shadow-md text-primary"
 >
 <Wallet className="w-6 h-6 transition-all duration-300 transform hover:scale-110 hover:text-accent text-primary" />
 </motion.div>

 <motion.div 
 animate={{ y: [0, -15, 0], rotate: [0, 12, 0] }}
 transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
 className="absolute bottom-12 left-10 p-3 !rounded-full glass-card shadow-md text-primary"
 >
 <Smartphone className="w-6 h-6 transition-all duration-300 transform hover:scale-110 hover:text-accent text-primary" />
 </motion.div>

 <motion.div 
 animate={{ y: [0, 8, 0], rotate: [0, -10, 0] }}
 transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.3 }}
 className="absolute bottom-6 right-12 p-3 !rounded-full glass-card shadow-md text-primary"
 >
 <Backpack className="w-6 h-6 transition-all duration-300 transform hover:scale-110 hover:text-accent text-primary" />
 </motion.div>
 </div>
 </motion.section>

 {/* ── HOW TO USE PORTAL ── */}
 <motion.section variants={scrollRevealVariants} initial="hidden" whileInView="visible" viewport={scrollRevealViewport} className="glass-panel rounded-xl p-8 sm:p-12 mb-10">
 <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text mb-6">How to Use the Portal</h2>
 <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <li className="flex items-start gap-4">
 <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">1</div>
 <div>
 <h3 className="text-lg font-bold text-primary mb-1">Report a Lost Item</h3>
 <p className="text-sm text-textSecondary leading-relaxed">Submit detailed information about what you lost, including a visual description and the last known location on campus.</p>
 </div>
 </li>
 <li className="flex items-start gap-4">
 <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">2</div>
 <div>
 <h3 className="text-lg font-bold text-primary mb-1">Search Found Items</h3>
 <p className="text-sm text-textSecondary leading-relaxed">Browse our real-time catalog of items found and turned in around campus to quickly spot your belongings.</p>
 </div>
 </li>
 <li className="flex items-start gap-4">
 <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">3</div>
 <div>
 <h3 className="text-lg font-bold text-primary mb-1">Claim Securely</h3>
 <p className="text-sm text-textSecondary leading-relaxed">Answer pre-configured security questions to prove ownership and securely place a claim on your item.</p>
 </div>
 </li>
 <li className="flex items-start gap-4">
 <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">4</div>
 <div>
 <h3 className="text-lg font-bold text-primary mb-1">Coordinate Pickup</h3>
 <p className="text-sm text-textSecondary leading-relaxed">Once your claim is verified by the staff, coordinate with the administration office to physically retrieve your item.</p>
 </div>
 </li>
 </ul>
 </motion.section>

 {/* ── STATISTICS SECTION ── */}
 <motion.section variants={scrollRevealVariants} initial="hidden" whileInView="visible" viewport={scrollRevealViewport} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 z-10 relative">
 {statsList.map((stat, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: idx * 0.08 }}
 className="glass-card rounded-xl p-5 flex flex-col justify-between border border-text/15 hover:border-text/30 transition-all duration-300 shadow-md shadow-primary/5"
 >
 <div className="text-secondary text-xs sm:text-sm font-bold mb-2">{stat.title}</div>
 <div className="flex items-baseline gap-1">
 <AnimatedCounter value={stat.value} suffix={stat.suffix} />
 </div>
 <div className="w-full h-1 bg-primary/10 rounded-xl mt-3 overflow-hidden">
 <div 
 className="h-full rounded-xl bg-primary-gradient" 
 style={{ 
 width: `${Math.min(stat.value / 3, 100)}%`
 }}
 />
 </div>
 </motion.div>
 ))}
 </motion.section>

 {/* ── HORIZONTAL FEATURED FOUND CAROUSEL ── */}
 <motion.section variants={scrollRevealVariants} initial="hidden" whileInView="visible" viewport={scrollRevealViewport} className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-primary animate-pulse" />
 <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">Featured Found Items</h2>
 </div>
 <div className="flex items-center gap-2">
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap" 
 onClick={() => scrollCarousel('left')}
 className="p-2 rounded-xl bg-surface border border-primary/10 text-secondary hover:text-text transition-colors"
 >
 <ChevronLeft className="w-4 h-4 text-primary" />
 </motion.button>
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap" 
 onClick={() => scrollCarousel('right')}
 className="p-2 rounded-xl bg-surface border border-primary/10 text-secondary hover:text-text transition-colors"
 >
 <ChevronRight className="w-4 h-4 text-primary" />
 </motion.button>
 </div>
 </div>

 {/* Carousel list wrapper */}
 <motion.div 
 variants={staggerContainer} initial="hidden" whileInView="visible" viewport={scrollRevealViewport}
 ref={carouselRef}
 className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar py-2 px-1"
 >
 {allItems.filter(i => i.status === 'Found').slice(0, 8).map((item, idx) => (
 <motion.div 
 key={item.id || idx}
 variants={{ ...staggerItem, ...tapHoverVariants }}
 whileHover="hover"
 whileTap="tap"
 onClick={() => setSelectedItemModal(item)}
 className="flex-shrink-0 w-72 glass-card rounded-xl overflow-hidden snap-start cursor-pointer transition-all"
 >
 <div className="h-36 w-full relative overflow-hidden bg-surface/30 flex items-center justify-center">
 {item.image_file ? (
 <img 
 src={`/static/uploads/${item.image_file}`} 
 alt={item.title} 
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 ) : (
 <CategoryImageFallback category={item.category} />
 )}
 <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[9px] font-black tracking-wider rounded-xl bg-emerald-500/20 text-emerald-855 border border-emerald-500/30 uppercase select-none">
 {item.status}
 </span>
 </div>
 <div className="p-4 space-y-2">
 <h3 className="font-extrabold text-sm text-text line-clamp-1">{item.title}</h3>
 <p className="text-xs text-textSecondary line-clamp-2">{item.description}</p>
 <div className="flex items-center gap-1 text-[10px] text-textMuted pt-2 border-t border-primary/5">
 <MapPin className="w-3.5 h-3.5 text-primary transition-all duration-300 transform hover:scale-110 hover:text-accent" />
 <span className="line-clamp-1">{item.location}</span>
 </div>
 </div>
 </motion.div>
 ))}
 </motion.div>
 </motion.section>

 {/* Split section: Filter / Grid grid & Interactive widgets */}
 <div className="flex flex-col lg:flex-row gap-8 relative">

 {/* ── MAIN SEARCH / GRID PANEL ── */}
 <div className="flex-1 space-y-6">

 {/* Search bar & Live dropdown filters */}
 <div className="space-y-4 glass-panel rounded-xl p-5 sm:p-6 border border-text/15">
 
 {/* Search Input */}
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-secondary" />
 <input
 type="text"
 placeholder="Search by wallet, airpods, keys..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent border border-text/15 text-sm text-text placeholder-[#927A69]/70 focus:outline-none focus:border-text/40 focus:bg-primary/5 focus:ring-4 focus:ring-secondary/15 transition-all"
 />
 </div>

 {/* Dropdown Filters row */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 
 {/* Category selector */}
 <div>
 <label className="block text-[10px] uppercase font-bold text-secondary mb-1">Category</label>
 <select
 value={selectedCategory}
 onChange={(e) => setSelectedCategory(e.target.value)}
 className="w-full text-xs bg-transparent border border-text/15 rounded-lg p-2 focus:outline-none focus:border-text/40 focus:bg-primary/5 text-text transition-colors"
 >
 <option value="All">All Categories</option>
 <option value="Electronics">Electronics</option>
 <option value="Wallets">Wallets</option>
 <option value="Keys">Keys</option>
 <option value="Bags">Bags</option>
 <option value="Documents">Documents</option>
 <option value="Clothing">Clothing</option>
 <option value="Accessories">Accessories</option>
 <option value="Others">Others</option>
 </select>
 </div>

 {/* Status selector */}
 <div>
 <label className="block text-[10px] uppercase font-bold text-secondary mb-1">Status</label>
 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="w-full text-xs bg-transparent border border-text/15 rounded-lg p-2 focus:outline-none focus:border-text/40 focus:bg-primary/5 text-text transition-colors"
 >
 <option value="All">All Statuses</option>
 <option value="Lost">Lost</option>
 <option value="Found">Found</option>
 </select>
 </div>

 {/* Location Selector */}
 <div>
 <label className="block text-[10px] uppercase font-bold text-secondary mb-1">Location</label>
 <select
 value={selectedLocation}
 onChange={(e) => setSelectedLocation(e.target.value)}
 className="w-full text-xs bg-transparent border border-text/15 rounded-lg p-2 focus:outline-none focus:border-text/40 focus:bg-primary/5 text-text transition-colors"
 >
 <option value="All">All Locations</option>
 {locationOptions.map((loc, i) => (
 <option key={i} value={loc}>{loc}</option>
 ))}
 </select>
 </div>

 {/* Date Selector */}
 <div>
 <label className="block text-[10px] uppercase font-bold text-secondary mb-1">Date Reported</label>
 <select
 value={selectedDate}
 onChange={(e) => setSelectedDate(e.target.value)}
 className="w-full text-xs bg-transparent border border-text/15 rounded-lg p-2 focus:outline-none focus:border-text/40 focus:bg-primary/5 text-text transition-colors"
 >
 <option value="All">Any Time</option>
 <option value="Today">Last 24 Hours</option>
 <option value="Week">Last 7 Days</option>
 <option value="Month">Last 30 Days</option>
 </select>
 </div>

 </div>

 {/* Category Chips Horizontal view */}
 <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2">
 {['All', 'Electronics', 'Wallets', 'Keys', 'Bags', 'Documents', 'Clothing', 'Accessories', 'Others'].map((cat) => (
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap"
 key={cat}
 onClick={() => setSelectedCategory(cat)}
 className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
 selectedCategory === cat 
 ? 'bg-primary text-white border-primary shadow-md shadow-primary/25' 
 : 'bg-transparent text-secondary border-primary/20 hover:text-text hover:bg-primary/10'
 }`}
 >
 {cat}
 </motion.button>
 ))}
 </div>

 </div>

 {/* Dynamic Grid list */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-lg text-text">Item Inventory ({filteredItems.length})</h3>
 {filteredItems.length === 0 && (
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap" 
 onClick={() => {
 setSearchQuery('');
 setSelectedCategory('All');
 setSelectedStatus('All');
 setSelectedLocation('All');
 setSelectedDate('All');
 }}
 className="text-xs font-semibold text-secondary hover:text-text"
 >
 Clear all filters
 </motion.button>
 )}
 </div>

 {loading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
 {[1, 2, 3, 4, 5, 6].map((n) => (
 <div key={n} className="glass-card rounded-xl h-80 animate-pulse bg-surface/20 border border-primary/5" />
 ))}
 </div>
 ) : filteredItems.length === 0 ? (
 <div className="glass-panel rounded-xl p-16 text-center text-textSecondary border border-dashed border-text/20 bg-surface/20">
 <AlertCircle className="w-10 h-10 text-textMuted/55 mx-auto mb-3" />
 <p className="text-base font-semibold">No items match your selected filters.</p>
 <p className="text-xs text-textMuted mt-1">Try resetting parameters or search input query.</p>
 </div>
 ) : (
 <motion.div 
 layout
 className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
 >
 <AnimatePresence>
 {filteredItems.map((item) => (
 <motion.div
 key={item.id}
 layout
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
 onClick={() => setSelectedItemModal(item)}
 className="glass-card flex flex-col overflow-hidden group cursor-pointer"
 >
 {/* Image fallbacks */}
 <div className="h-44 w-full bg-surface/30 relative overflow-hidden flex items-center justify-center border-b border-primary/5">
 {item.image_file ? (
 <img 
 src={`/static/uploads/${item.image_file}`} 
 alt={item.title} 
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 ) : (
 <CategoryImageFallback category={item.category} />
 )}

 {/* Status tag badge */}
 <span className={`absolute top-3 right-3 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md select-none border ${
 item.status === 'Lost' 
 ? 'bg-rose-500/20 text-rose-800 border-rose-500/30' 
 : item.status === 'Claimed'
 ? 'bg-slate-500/20 text-slate-800 border-slate-500/30'
 : 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30'
 }`}>
 {item.status}
 </span>

 {/* Hover elements overlay */}
 <div className="absolute bottom-3 left-3 flex gap-2">
 {/* Bookmark */}
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap"
 onClick={(e) => toggleBookmark(item.id, e)}
 className="p-2 rounded-xl bg-surface border border-primary/10 text-secondary hover:text-primary transition-all duration-300 transform hover:scale-110"
 >
 <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(item.id) ? 'fill-primary text-primary' : ''}`} />
 </motion.button>
 {/* Share */}
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap"
 onClick={(e) => handleShareItem(item, e)}
 className="p-2 rounded-xl bg-surface border border-primary/10 text-secondary hover:text-primary transition-all duration-300 transform hover:scale-110"
 >
 <Share2 className="w-4 h-4" />
 </motion.button>
 </div>
 </div>

 {/* Card Content details */}
 <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
 <div className="space-y-2">
 <h3 className="font-extrabold text-base text-text group-hover:text-primary transition-colors line-clamp-1">
 {item.title}
 </h3>
 <p className="text-xs text-textSecondary line-clamp-2 leading-relaxed">
 {item.description}
 </p>
 </div>

 <div className="space-y-1.5 text-[11px] text-textMuted pt-2 border-t border-primary/5">
 <div className="flex items-center gap-1.5">
 <MapPin className="w-3.5 h-3.5 text-primary transition-all duration-300 transform hover:scale-110 hover:text-accent" />
 <span>{item.location}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-primary transition-all duration-300 transform hover:scale-110 hover:text-accent" />
 <span>{formatDate(item.date)}</span>
 </div>
 </div>

 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap"
 onClick={() => setSelectedItemModal(item)}
 className="w-full py-2.5 rounded-xl btn-secondary-custom text-xs font-bold flex items-center justify-center gap-1.5"
 >
 <Eye className="w-3.5 h-3.5 text-primary transition-all duration-300 transform hover:scale-110 hover:text-accent" />
 <span>View Details</span>
 </motion.button>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </motion.div>
 )}
 </div>

 </div>

 {/* ── RIGHT PANEL WIDGETS ── */}
 <aside className="w-full lg:w-80 space-y-8">
 
 {/* Interactive SVG Campus Map */}
 <div className="glass-panel rounded-xl p-5 border border-text/15 space-y-4 bg-surface/20">
 <div className="flex items-center gap-2">
 <Map className="w-5 h-5 text-primary" />
 <h4 className="font-bold text-sm text-text">Campus Location Map</h4>
 </div>
 
 {/* Campus SVG layout Map tracker container */}
 <div className="w-full h-64 rounded-xl border border-text/15 bg-transparent relative overflow-hidden flex items-center justify-center">
 
 {/* Styled SVG layout map grid */}
 <svg className="w-full h-full text-secondary/45 select-none" viewBox="0 0 400 300">
 {/* Grass / Park areas */}
 <rect x="20" y="20" width="360" height="260" rx="14" fill="#F3E7D9" />
 <path d="M 120 80 Q 200 130 280 80 T 360 80" fill="none" stroke="rgba(92,50,30,0.02)" strokeWidth="80" strokeLinecap="round" />
 
 {/* Campus Paths / Roads */}
 <path d="M 50 150 L 350 150 L 200 50 L 200 250" fill="none" stroke="rgba(92,50,30,0.04)" strokeWidth="12" strokeLinecap="round" />
 
 {/* Buildings landmarks */}
 <rect x="90" y="120" width="60" height="50" rx="8" fill="rgba(92,50,30,0.05)" stroke="rgba(92,50,30,0.15)" strokeWidth="1.5" />
 <text x="120" y="148" fill="rgba(92,50,30,0.4)" fontSize="8" fontWeight="bold" textAnchor="middle">Library</text>

 <rect x="220" y="160" width="70" height="50" rx="8" fill="rgba(92,50,30,0.05)" stroke="rgba(92,50,30,0.15)" strokeWidth="1.5" />
 <text x="255" y="188" fill="rgba(92,50,30,0.4)" fontSize="8" fontWeight="bold" textAnchor="middle">Cafeteria</text>

 <rect x="160" y="50" width="60" height="40" rx="8" fill="rgba(92,50,30,0.05)" stroke="rgba(92,50,30,0.15)" strokeWidth="1.5" />
 <text x="190" y="74" fill="rgba(92,50,30,0.4)" fontSize="8" fontWeight="bold" textAnchor="middle">Science</text>

 <rect x="40" y="210" width="60" height="50" rx="8" fill="rgba(92,50,30,0.05)" stroke="rgba(92,50,30,0.15)" strokeWidth="1.5" />
 <text x="70" y="238" fill="rgba(92,50,30,0.4)" fontSize="8" fontWeight="bold" textAnchor="middle">Gym</text>

 <rect x="310" y="70" width="60" height="50" rx="8" fill="rgba(92,50,30,0.05)" stroke="rgba(92,50,30,0.15)" strokeWidth="1.5" />
 <text x="340" y="98" fill="rgba(92,50,30,0.4)" fontSize="8" fontWeight="bold" textAnchor="middle">Parking</text>
 </svg>

 {/* Pulsing Hotspot pins */}
 {dynamicMapHotspots.map((pin, index) => {
 const target = allItems.find(m => m.id === pin.itemRef);
 const isHovered = hoveredMapPin?.id === pin.itemRef;
 const isActive = activeMapPin?.id === pin.itemRef;

 return (
 <div 
 key={index}
 style={{ position: 'absolute', left: `${pin.x}px`, top: `${pin.y}px` }}
 className="group"
 onMouseEnter={() => target && setHoveredMapPin(target)}
 onMouseLeave={() => setHoveredMapPin(null)}
 onClick={() => target && setActiveMapPin(isActive ? null : target)}
 >
 {/* Animated Outer Pulse */}
 <div className="absolute -left-3 -top-3 w-6 h-6 rounded-xl bg-primary/25 animate-pin-pulse" />
 
 {/* Pin Center Marker */}
 <div className={`w-3.5 h-3.5 rounded-xl border border-white cursor-pointer relative z-10 transition-colors shadow-md ${
 isActive ? 'bg-primary' : 'bg-secondary hover:bg-primary'
 }`}>
 <div className="absolute inset-1.5 rounded-xl bg-white animate-pulse" />
 </div>

 {/* Pin Tooltip Card overlay on hover */}
 {target && (isHovered || isActive) && (
 <div 
 style={{ transform: 'translate(-50%, -108%)' }}
 className="absolute left-1.5 top-0 w-44 z-50 glass-panel rounded-xl p-3 border border-primary/20 text-xs shadow-lg bg-shade-5/95"
 >
 <div className="font-extrabold text-text truncate">{target.title}</div>
 <div className="text-[10px] text-secondary font-semibold mb-1 truncate">{target.location}</div>
 <div className="text-[9px] text-textMuted flex items-center justify-between">
 <span>{target.category}</span>
 <span className={`p-1.5 rounded-lg border border-primary/5 shadow-sm ${
 target.status === 'Lost' 
 ? 'bg-rose-500/10 text-rose-700' 
 : target.status === 'Claimed'
 ? 'bg-slate-500/10 text-slate-700'
 : 'bg-emerald-500/10 text-emerald-700'
 }`}>{target.status}</span>
 </div>
 </div>
 )}

 </div>
 );
 })}
 </div>
 <p className="text-[10px] text-textSecondary text-center">Hover over custom markers to reveal reported items details.</p>
 </div>

 {/* Recent Activity Timeline panel */}
 <div className="glass-panel rounded-xl p-5 border border-text/15 space-y-4 bg-surface/20">
 <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
 <Clock className="w-5 h-5 text-primary animate-pulse" />
 <h4 className="font-bold text-sm text-text">Recent Activity Timeline</h4>
 </div>

 {/* Vertical Timeline entries */}
 <div className="relative pl-6 space-y-6">
 
 {/* Vertical border timeline bar line */}
 <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-primary/10" />
 
 {[
 { text: 'Wallet found near Cafeteria', date: '10 mins ago', type: 'found', dot: 'bg-emerald-500' },
 { text: 'Phone claimed successfully', date: '1 hr ago', type: 'returned', dot: 'bg-indigo-500' },
 { text: 'Keys reported lost near Parking', date: '3 hrs ago', type: 'lost', dot: 'bg-rose-500' },
 { text: 'Backpack returned by Alex', date: 'Yesterday', type: 'found', dot: 'bg-emerald-500' },
 { text: 'ID card matched with Sarah', date: '2 days ago', type: 'matched', dot: 'bg-purple-500' }
 ].map((act, idx) => (
 <div key={idx} className="relative text-xs space-y-1">
 
 {/* Timeline Node Dot */}
 <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-xl border border-shade-5 ring-2 ring-shade-5/50 ${act.dot}`} />
 
 <div className="font-semibold text-primary">{act.text}</div>
 <div className="text-[9px] text-textMuted font-medium">{act.date}</div>
 </div>
 ))}

 </div>
 </div>

 </aside>

 </div>

 {/* ── FEEDBACK & SUPPORT SECTION ── */}
 <motion.section variants={scrollRevealVariants} initial="hidden" whileInView="visible" viewport={scrollRevealViewport} className="mt-12 glass-panel rounded-xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 border border-text/15 shadow-lg">
 <div className="flex-1 space-y-3 text-center sm:text-left">
 <h3 className="text-2xl font-black font-heading text-text">Need Help or Have Feedback?</h3>
 <p className="text-sm text-textSecondary max-w-lg mx-auto sm:mx-0">
 Encountering issues with a claim? Need assistance navigating the portal? Reach out to our administrative support team to get your questions answered.
 </p>
 </div>
 <Link 
 to="/contact" 
 className="px-8 py-4 rounded-xl btn-primary-custom font-bold text-sm flex items-center gap-2 flex-shrink-0"
 >
 <PhoneCall className="w-4 h-4 text-textSecondary" />
 <span>Contact Support</span>
 </Link>
 </motion.section>


 {/* ── VIEW DETAILS GLASSMORPHISM MODAL ── */}
 <AnimatePresence>
 {selectedItemModal && createPortal(
 <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
 
 {/* Dark blur background backdrop overlay */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setSelectedItemModal(null)}
 className="absolute inset-0 bg-black/50"
 style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
 />

 {/* Glassmorphic detailed dialog modal */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="w-full max-w-lg glass-panel rounded-xl overflow-hidden border border-text/15 relative z-10 bg-shade-5"
 >
 
 {/* Close Button */}
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap"
 onClick={() => setSelectedItemModal(null)}
 className="absolute top-4 right-4 p-2 rounded-xl bg-surface/50 text-secondary hover:text-primary hover:bg-surface border border-primary/20 cursor-pointer z-50 transition-colors"
 >
 <X className="w-4 h-4 text-primary transition-all duration-300 transform hover:scale-110 hover:text-accent" />
 </motion.button>

 {/* Graphic Category Header */}
 <div className="h-48 w-full relative border-b border-primary/10">
 {selectedItemModal.image_file ? (
 <img 
 src={selectedItemModal.image_file.startsWith('data:') || selectedItemModal.image_file.startsWith('http') ? selectedItemModal.image_file : `/static/uploads/${selectedItemModal.image_file}`} 
 alt={selectedItemModal.title} 
 className="w-full h-full object-cover"
 />
 ) : (
 <CategoryImageFallback category={selectedItemModal.category} />
 )}

 {/* Status tag */}
 <span className={`absolute top-4 left-4 px-3.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg border ${
 selectedItemModal.status === 'Lost' 
 ? 'bg-rose-500/20 text-rose-700 border-rose-500/30' 
 : selectedItemModal.status === 'Claimed'
 ? 'bg-slate-500/20 text-slate-700 border-slate-500/30'
 : 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30'
 }`}>
 {selectedItemModal.status}
 </span>
 </div>

 {/* Detailed Content body */}
 <div className="p-6 sm:p-8 space-y-6">
 
 <div className="space-y-2">
 <h3 className="text-xl sm:text-2xl font-black text-text tracking-tight leading-tight">{selectedItemModal.title}</h3>
 <div className="flex flex-wrap gap-2 pt-1">
 <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/5 text-[10px] font-bold text-text">
 {selectedItemModal.category}
 </span>
 <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/5 text-[10px] font-bold text-secondary flex items-center gap-1">
 <MapPin className="w-3 h-3 text-primary transition-all duration-300 transform hover:scale-110 hover:text-accent" />
 {selectedItemModal.location}
 </span>
 </div>
 </div>

 <div className="space-y-3">
 <h4 className="text-xs uppercase font-bold text-textSecondary tracking-wider">Item Description</h4>
 <p className="text-sm text-text leading-relaxed bg-surface/50 border border-primary/5 p-4 rounded-xl">
 {selectedItemModal.description}
 </p>
 </div>

 {/* Date & reporter meta row */}
 <div className="grid grid-cols-2 gap-4 text-xs bg-surface/50 p-4 rounded-xl border border-primary/5">
 <div className="space-y-1">
 <span className="text-textSecondary font-semibold block uppercase text-[9px] tracking-wider">Reported Date</span>
 <span className="text-text font-bold">{formatDate(selectedItemModal.date)}</span>
 </div>
 <div className="space-y-1">
 <span className="text-textSecondary font-semibold block uppercase text-[9px] tracking-wider">Reporter Email</span>
 <span className="text-text font-bold truncate block">{selectedItemModal.reporter_email}</span>
 </div>
 </div>

 {/* Claim verification security query if applicable */}
 {selectedItemModal.security_question && (
 <div className="space-y-2 text-xs bg-primary/5 p-4 rounded-xl border border-primary/20">
 <div className="font-bold text-primary flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5 text-primary" />
 <span>Security Verification Quest</span>
 </div>
 <p className="text-text/95">{selectedItemModal.security_question}</p>
 </div>
 )}

 {/* Modal actions */}
 <div className="flex gap-4 pt-2">
 <motion.button variants={buttonHoverVariants} whileHover="hover" whileTap="tap" 
 onClick={() => {
 setSelectedItemModal(null);
 triggerToast('Claim request details generated. Check inbox.');
 }}
 className="flex-1 py-3 rounded-xl btn-primary-custom font-extrabold text-sm text-center"
 >
 Claim & Recover Item
 </motion.button>
 <motion.button variants={tapHoverVariants} whileHover="hover" whileTap="tap"
 onClick={(e) => toggleBookmark(selectedItemModal.id, e)}
 className="px-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/10 text-secondary hover:text-primary transition-colors"
 >
 <Bookmark className={`w-5 h-5 ${bookmarkedIds.includes(selectedItemModal.id) ? 'fill-primary text-primary' : ''}`} />
 </motion.button>
 </div>

 </div>

 </motion.div>
 </div>,
 document.body
 )}
 </AnimatePresence>

 </div>
 </AmbientGlowBg>
 );
};

export default Home;
