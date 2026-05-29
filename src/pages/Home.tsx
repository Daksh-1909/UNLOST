import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, PlusCircle, Calendar, MapPin, Tag, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  date: string;
  image_file: string | null;
  reporter_email: string;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [latestItems, setLatestItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestItems = async () => {
      try {
        const response = await fetch('/api/items');
        const data = await response.json();
        if (response.ok && data.success) {
          setLatestItems(data.items.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching latest items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestItems();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
  };

  return (
    <div className="space-y-12">
      {/* Hero Welcome Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-slate-900/80 via-slate-800/40 to-slate-900/80"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-6 max-w-2xl text-center md:text-left z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-extrabold font-heading tracking-tight text-white leading-tight"
          >
            Welcome Back, <span className="bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">{user?.username}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-400 font-normal leading-relaxed"
          >
            Centralized portal to report and recover lost items. Browse found materials or post your lost details with security checks to claim them.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2"
          >
            <Link
              to="/items"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition-all text-sm font-semibold flex items-center gap-2 text-white"
            >
              <Search className="h-4 w-4" />
              <span>Browse Items</span>
            </Link>
            <Link
              to="/report"
              className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 shadow text-sm font-semibold flex items-center gap-2 text-slate-200 transition-all"
            >
              <PlusCircle className="h-4 w-4 text-pink-400" />
              <span>Report Lost Item</span>
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center animate-float z-10"
        >
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl filter animate-pulse"></div>
          <span className="text-8xl select-none">🔍</span>
        </motion.div>
      </motion.div>

      {/* Latest Items section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-heading text-white">Latest Activity</h2>
            <p className="text-sm text-slate-400">Recently reported lost and found items on campus</p>
          </div>
          <Link 
            to="/items" 
            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group transition-all"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-2xl h-80 animate-pulse bg-slate-800/20"></div>
            ))}
          </div>
        ) : latestItems.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 border border-dashed border-white/5 bg-slate-900/30">
            <p className="text-lg">No items reported recently.</p>
            <Link to="/report" className="text-indigo-400 hover:text-indigo-300 underline text-sm mt-2 inline-block">
              Report the first item now
            </Link>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {latestItems.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="glass-card rounded-2xl flex flex-col overflow-hidden group"
              >
                {/* Image or Category placeholder */}
                <div className="h-44 w-full bg-slate-950/40 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                  {item.image_file ? (
                    <img 
                      src={`/static/uploads/${item.image_file}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Tag className="h-10 w-10 text-indigo-500/40" />
                      <span className="text-xs uppercase tracking-wider">{item.category}</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full shadow-md select-none ${
                    item.status === 'Lost' 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>

                  <Link
                    to="/items"
                    className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-indigo-600 border border-white/5 hover:border-indigo-500 text-slate-200 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow group-hover:shadow-indigo-500/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Details</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;
