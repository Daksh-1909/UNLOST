import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { scrollRevealVariants, staggerContainer, staggerItem } from '../utils/animations';

interface Analytics {
  totalItems: number;
  statusCounts: { [key: string]: number };
  categories: { name: string; value: number }[];
  claimsPending: any[];
}

const COLORS = ['#5C321E', '#926347', '#C9A07A', '#E6CAAB'];

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAnalytics(data.analytics);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchAnalytics();

    const handleUpdate = () => fetchAnalytics();
    window.addEventListener('unlost:item_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    document.addEventListener('visibilitychange', handleUpdate);

    const interval = setInterval(fetchAnalytics, 5000);

    return () => {
      window.removeEventListener('unlost:item_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/items/${id}/approve-claim`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAnalytics(prev => prev ? {
          ...prev,
          claimsPending: prev.claimsPending.filter(c => c._id !== id)
        } : null);
        window.dispatchEvent(new Event('unlost:item_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center p-10">Loading analytics...</div>;
  if (!analytics) return <div className="text-center p-10 text-danger">Failed to load analytics</div>;

  const statusData = Object.entries(analytics.statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-8"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-3xl font-bold font-heading mb-2">Platform Analytics</h1>
        <p className="text-textSecondary">Overview of all UNLOST operations</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Items KPI */}
        <motion.div variants={scrollRevealVariants} className="glass-panel p-6 flex flex-col justify-center items-center">
          <span className="text-4xl font-bold text-primary">{analytics.totalItems}</span>
          <span className="text-sm text-textSecondary uppercase tracking-widest mt-2">Total Reports</span>
        </motion.div>
        
        {/* Returned Items KPI */}
        <motion.div variants={scrollRevealVariants} className="glass-panel p-6 flex flex-col justify-center items-center">
          <span className="text-4xl font-bold text-success">{analytics.statusCounts['Returned'] || 0}</span>
          <span className="text-sm text-textSecondary uppercase tracking-widest mt-2">Items Returned</span>
        </motion.div>

        {/* Pending Claims KPI */}
        <motion.div variants={scrollRevealVariants} className="glass-panel p-6 flex flex-col justify-center items-center">
          <span className="text-4xl font-bold text-warning">{analytics.claimsPending.length}</span>
          <span className="text-sm text-textSecondary uppercase tracking-widest mt-2">Pending Claims</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Chart */}
        <motion.div variants={scrollRevealVariants} className="glass-panel p-6">
          <h3 className="font-bold mb-4 border-b border-border/30 pb-2">Reports by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {analytics.categories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Chart */}
        <motion.div variants={scrollRevealVariants} className="glass-panel p-6">
          <h3 className="font-bold mb-4 border-b border-border/30 pb-2">Reports by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke="#6B5B4D" />
                <YAxis stroke="#6B5B4D" />
                <Tooltip />
                <Bar dataKey="value" fill="#926347" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Claims Pending Review */}
      <motion.div variants={scrollRevealVariants} className="glass-panel p-6">
        <h3 className="font-bold mb-4 border-b border-border/30 pb-2">Pending Claim Approvals</h3>
        {analytics.claimsPending.length === 0 ? (
          <p className="text-textSecondary text-sm">No pending claims to review.</p>
        ) : (
          <div className="space-y-4">
            {analytics.claimsPending.map(claim => (
              <div key={claim._id} className="bg-surface p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{claim.title}</h4>
                  <p className="text-sm text-textSecondary">Claimant: {claim.claimant_email}</p>
                  <p className="text-sm bg-primary/5 p-2 rounded mt-2 font-mono">"{claim.claim_answers?.answer || 'No answer provided'}"</p>
                </div>
                <button
                  onClick={() => handleApprove(claim._id)}
                  className="px-4 py-2 bg-success text-white rounded-xl text-sm font-bold flex items-center shadow-lg hover:scale-105 transition-transform"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Return
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminAnalytics;
