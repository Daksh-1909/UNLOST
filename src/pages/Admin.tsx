import React, { useEffect, useState } from 'react';
import { Shield, Users, Layers, AlertTriangle, Archive, RefreshCw, Trash2, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminStats {
  total_items: number;
  total_users: number;
  archived_items: number;
  new_today: number;
  security_alerts: number;
}

interface RecentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  location: string;
  date: string;
  reporter_email: string;
}

interface TrashItem {
  id: string;
  title: string;
  previous_status: string;
  deleted_at: string;
  days_deleted: number | null;
}

interface AdminLog {
  action: string;
  item_title: string;
  timestamp: string;
  user: string;
  item_id: string;
}

interface AdminData {
  stats: AdminStats;
  recent_items: RecentItem[];
  trash_items: TrashItem[];
  logs: AdminLog[];
}

const Admin: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'trash' | 'logs'>('overview');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const resData = await response.json();
      if (response.ok && resData.success) {
        setData(resData);
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to move this item to recoverable trash?')) return;
    try {
      const response = await fetch(`/api/admin/delete/${itemId}`, { method: 'POST' });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setActionMessage({ type: 'success', text: resData.message });
        fetchAdminStats();
      } else {
        setActionMessage({ type: 'error', text: resData.message || 'Failed to archive item.' });
      }
    } catch (error) {
      console.error('Delete item error:', error);
      setActionMessage({ type: 'error', text: 'Server is currently unreachable.' });
    }
  };

  const handleRecoverItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/recover/${itemId}`, { method: 'POST' });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setActionMessage({ type: 'success', text: resData.message });
        fetchAdminStats();
      } else {
        setActionMessage({ type: 'error', text: resData.message || 'Failed to recover item.' });
      }
    } catch (error) {
      console.error('Recover item error:', error);
      setActionMessage({ type: 'error', text: 'Server is currently unreachable.' });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/25 border-t-indigo-500"></div>
          <span className="absolute text-xs font-semibold text-indigo-400">UL</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Active Items', value: data?.stats.total_items ?? 0, icon: Layers, color: 'text-indigo-400 border-indigo-500/10 bg-indigo-500/5' },
    { title: 'Registered Users', value: data?.stats.total_users ?? 0, icon: Users, color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5' },
    { title: 'Archived Trash', value: data?.stats.archived_items ?? 0, icon: Archive, color: 'text-slate-400 border-slate-500/10 bg-slate-500/5' },
    { title: "Today's Activities", value: data?.stats.new_today ?? 0, icon: Clock, color: 'text-pink-400 border-pink-500/10 bg-pink-500/5' },
    { title: 'Security Alerts', value: data?.stats.security_alerts ?? 0, icon: AlertTriangle, color: 'text-rose-400 border-rose-500/10 bg-rose-500/5' },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-400" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-sm text-slate-400">Perform systems monitoring, claim audits, and data retention overrides</p>
        </div>
        <button
          onClick={fetchAdminStats}
          className="self-start sm:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all shadow"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action alerts */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-3 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-semibold underline hover:text-white"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat grid widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between space-y-3 ${card.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</span>
              <card.icon className="h-5 w-5 opacity-80" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'items', label: 'Manage Items' },
          { id: 'trash', label: 'Trash (Recovery Center)' },
          { id: 'logs', label: 'Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="glass-panel rounded-2xl p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">Recent Listings</h3>
              <div className="space-y-3">
                {data?.recent_items.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-950/20 border border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.category} • {item.location}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      item.status === 'Lost' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">Security Audit Preview</h3>
              <div className="space-y-3">
                {data?.logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950/20 border border-white/5 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold">{log.user}</span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    <p className={`font-medium ${
                      log.action.includes('Security Alert') ? 'text-rose-400' : 'text-slate-200'
                    }`}>
                      {log.action} {log.item_title && `• ${log.item_title}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ITEMS TAB */}
        {activeTab === 'items' && (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              {data?.recent_items.length === 0 ? (
                <p className="text-center py-6 text-slate-500 text-sm">No items in the system.</p>
              ) : (
                <table className="min-w-full divide-y divide-white/5 text-sm text-left">
                  <thead>
                    <tr className="text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-white/5">
                      <th className="py-3 px-4">Item Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Reporter</th>
                      <th className="py-3 px-4">Listed Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data?.recent_items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-950/20 transition-all text-slate-200">
                        <td className="py-3.5 px-4 font-bold max-w-[200px] truncate">{item.title}</td>
                        <td className="py-3.5 px-4">{item.category}</td>
                        <td className="py-3.5 px-4">{item.location}</td>
                        <td className="py-3.5 px-4 truncate max-w-[150px]">{item.reporter_email}</td>
                        <td className="py-3.5 px-4">{formatDate(item.date)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                            title="Soft Delete (Move to Trash)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TRASH TAB */}
        {activeTab === 'trash' && (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              {data?.trash_items.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Archive className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                  <p>Trash is empty. Soft deleted listings are saved here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>Soft deleted items are retained here for up to 10 days before automatic permanent collection purge.</span>
                  </div>

                  <table className="min-w-full divide-y divide-white/5 text-sm text-left">
                    <thead>
                      <tr className="text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-white/5">
                        <th className="py-3 px-4">Item Title</th>
                        <th className="py-3 px-4">Previous Status</th>
                        <th className="py-3 px-4">Deleted On</th>
                        <th className="py-3 px-4">Days in Trash</th>
                        <th className="py-3 px-4 text-right">Recovery Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data?.trash_items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-950/20 transition-all text-slate-200">
                          <td className="py-3.5 px-4 font-bold">{item.title}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full text-xs">
                              {item.previous_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">{formatDate(item.deleted_at)}</td>
                          <td className="py-3.5 px-4 font-semibold">
                            {item.days_deleted !== null ? (
                              <span className={item.days_deleted >= 9 ? 'text-rose-400' : 'text-slate-300'}>
                                {item.days_deleted} / 10 days
                              </span>
                            ) : (
                              'Unknown'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleRecoverItem(item.id)}
                              className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ml-auto"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              <span>Recover Item</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              {data?.logs.length === 0 ? (
                <p className="text-center py-6 text-slate-500 text-sm">No audit logs reported.</p>
              ) : (
                <table className="min-w-full divide-y divide-white/5 text-sm text-left">
                  <thead>
                    <tr className="text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-white/5">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action Event</th>
                      <th className="py-3 px-4">Entity reference</th>
                      <th className="py-3 px-4">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data?.logs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-950/20 transition-all text-slate-200">
                        <td className="py-3.5 px-4 font-medium flex items-center gap-1.5 text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(log.timestamp)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold ${
                            log.action.includes('Security Alert') ? 'text-rose-400' : 'text-slate-200'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{log.item_title || 'N/A'}</td>
                        <td className="py-3.5 px-4 truncate max-w-[150px] font-semibold text-indigo-300">{log.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
