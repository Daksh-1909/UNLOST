import React, { useEffect, useState } from 'react';
import { 
  Shield, Users, Layers, AlertTriangle, Archive, RefreshCw, 
  Trash2, Clock, CheckCircle2, AlertCircle, Calendar, Search, X, 
  ShieldCheck, UserCheck, Filter, MessageSquare, Mail, Send, Check, Trash 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, staggerContainer, staggerItem, tapHoverVariants, TRANSITION_BASE } from '../utils/animations';

interface AdminStats {
  total_items: number;
  total_users: number;
  archived_items: number;
  new_today: number;
  security_alerts: number;
  unread_messages?: number;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: string;
  user_email?: string;
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

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: string;
  is_admin: boolean;
  auth_provider?: string;
  profilePicture?: string | null;
  lastLogin?: string | null;
  date_created?: string | null;
}

interface AdminData {
  stats: AdminStats;
  recent_items: RecentItem[];
  trash_items: TrashItem[];
  logs: AdminLog[];
  users: UserItem[];
  contact_messages?: ContactMessage[];
}

const Admin: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'users' | 'items' | 'trash' | 'logs'>('overview');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgStatusFilter, setMsgStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Pagination state
  const [usersPage, setUsersPage] = useState(1);
  const [itemsPage, setItemsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [msgPage, setMsgPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleMarkMessageRead = async (msgId: string) => {
    setData(prev => {
      if (!prev) return prev;
      const updatedMessages = (prev.contact_messages || []).map(m =>
        m.id === msgId ? { ...m, status: 'read' } : m
      );
      const unreadCount = updatedMessages.filter(m => m.status === 'unread').length;
      return {
        ...prev,
        contact_messages: updatedMessages,
        stats: {
          ...prev.stats,
          unread_messages: unreadCount
        }
      };
    });

    try {
      const response = await fetch(`/api/admin/messages/${msgId}/mark-read`, { method: 'POST' });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setActionMessage({ type: 'success', text: 'Message marked as read.' });
      } else {
        fetchAdminStats();
      }
    } catch (error) {
      console.error('Mark read error:', error);
      fetchAdminStats();
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) return;
    
    setData(prev => {
      if (!prev) return prev;
      const updatedMessages = (prev.contact_messages || []).filter(m => m.id !== msgId);
      const unreadCount = updatedMessages.filter(m => m.status === 'unread').length;
      return {
        ...prev,
        contact_messages: updatedMessages,
        stats: {
          ...prev.stats,
          unread_messages: unreadCount
        }
      };
    });

    try {
      const response = await fetch(`/api/admin/messages/${msgId}/delete`, { method: 'POST' });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setActionMessage({ type: 'success', text: 'Message deleted successfully.' });
      } else {
        fetchAdminStats();
      }
    } catch (error) {
      console.error('Delete message error:', error);
      fetchAdminStats();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to move this item to recoverable trash?')) return;
    
    setData(prev => {
      if (!prev) return prev;
      const targetItem = prev.recent_items.find(i => i.id === itemId);
      const updatedRecent = prev.recent_items.filter(i => i.id !== itemId);
      const updatedTrash = targetItem ? [
        {
          id: targetItem.id,
          title: targetItem.title,
          previous_status: targetItem.status,
          deleted_at: new Date().toISOString(),
          days_deleted: 0
        },
        ...prev.trash_items
      ] : prev.trash_items;

      return {
        ...prev,
        recent_items: updatedRecent,
        trash_items: updatedTrash,
        stats: {
          ...prev.stats,
          total_items: Math.max(0, prev.stats.total_items - 1),
          archived_items: prev.stats.archived_items + 1
        }
      };
    });

    try {
      const response = await fetch(`/api/admin/delete/${itemId}`, { method: 'POST' });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setActionMessage({ type: 'success', text: resData.message });
      } else {
        setActionMessage({ type: 'error', text: resData.message || 'Failed to archive item.' });
        fetchAdminStats();
      }
    } catch (error) {
      console.error('Delete item error:', error);
      setActionMessage({ type: 'error', text: 'Server is currently unreachable.' });
      fetchAdminStats();
    }
  };

  const handleRecoverItem = async (itemId: string) => {
    setData(prev => {
      if (!prev) return prev;
      const targetTrash = prev.trash_items.find(i => i.id === itemId);
      const updatedTrash = prev.trash_items.filter(i => i.id !== itemId);
      const updatedRecent = targetTrash ? [
        {
          id: targetTrash.id,
          title: targetTrash.title,
          category: 'Recovered',
          status: targetTrash.previous_status || 'Active',
          location: 'Recovered',
          date: new Date().toISOString(),
          reporter_email: 'Admin'
        },
        ...prev.recent_items
      ] : prev.recent_items;

      return {
        ...prev,
        trash_items: updatedTrash,
        recent_items: updatedRecent,
        stats: {
          ...prev.stats,
          total_items: prev.stats.total_items + 1,
          archived_items: Math.max(0, prev.stats.archived_items - 1)
        }
      };
    });

    try {
      const response = await fetch(`/api/admin/recover/${itemId}`, { method: 'POST' });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setActionMessage({ type: 'success', text: resData.message });
      } else {
        setActionMessage({ type: 'error', text: resData.message || 'Failed to recover item.' });
        fetchAdminStats();
      }
    } catch (error) {
      console.error('Recover item error:', error);
      setActionMessage({ type: 'error', text: 'Server is currently unreachable.' });
      fetchAdminStats();
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCardClick = (tab: 'overview' | 'messages' | 'users' | 'items' | 'trash' | 'logs', filterText?: string) => {
    setActiveTab(tab);
    if (filterText) {
      setLogSearchQuery(filterText);
    } else {
      setLogSearchQuery('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-xl border-4 border-primary/25 border-t-primary"></div>
          <span className="absolute text-xs font-semibold text-primary">UL</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Contact Messages', 
      value: data?.stats.unread_messages ? `${data.stats.unread_messages} Unread` : (data?.contact_messages?.length ?? 0), 
      icon: MessageSquare, 
      color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/50',
      tab: 'messages' as const
    },
    { 
      title: 'Active Items', 
      value: data?.stats.total_items ?? 0, 
      icon: Layers, 
      color: 'text-primary border-primary/20 bg-primary/5 hover:border-primary/50',
      tab: 'items' as const
    },
    { 
      title: 'Registered Users', 
      value: data?.stats.total_users ?? 0, 
      icon: Users, 
      color: 'text-success border-success/20 bg-success/5 hover:border-success/50',
      tab: 'users' as const
    },
    { 
      title: 'Archived Trash', 
      value: data?.stats.archived_items ?? 0, 
      icon: Archive, 
      color: 'text-textSecondary border-textSecondary/20 bg-textSecondary/5 hover:border-textSecondary/50',
      tab: 'trash' as const
    },
    { 
      title: "Today's Activities", 
      value: data?.stats.new_today ?? 0, 
      icon: Clock, 
      color: 'text-accent border-accent/20 bg-accent/5 hover:border-accent/50',
      tab: 'logs' as const
    },
    { 
      title: 'Security Alerts', 
      value: data?.stats.security_alerts ?? 0, 
      icon: AlertTriangle, 
      color: 'text-danger border-danger/20 bg-danger/5 hover:border-danger/50',
      tab: 'logs' as const,
      filter: 'Security Alert'
    },
  ];

  // Filtering contact messages
  const filteredMessages = (data?.contact_messages || []).filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(msgSearchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(msgSearchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(msgSearchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(msgSearchQuery.toLowerCase());

    if (msgStatusFilter === 'unread') return matchesSearch && m.status === 'Unread';
    if (msgStatusFilter === 'read') return matchesSearch && m.status === 'Read';
    return matchesSearch;
  });

  // Filtering users
  const filteredUsers = (data?.users || []).filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(userSearchQuery.toLowerCase()));
    
    if (userRoleFilter === 'admin') return matchesSearch && (u.is_admin || u.role === 'admin');
    if (userRoleFilter === 'user') return matchesSearch && (!u.is_admin && u.role !== 'admin');
    return matchesSearch;
  });

  // Filtering items
  const filteredItems = (data?.recent_items || []).filter(i => 
    i.title.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    i.location.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    i.reporter_email.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  // Filtering logs
  const filteredLogs = (data?.logs || []).filter(l => 
    l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    l.user.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    l.item_title.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Title */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-text tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-sm text-textSecondary">Manage system operations, view global statistics, search registered users, read contact messages, and moderate reported items.</p>
        </div>
        <motion.button
          onClick={fetchAdminStats}
          variants={tapHoverVariants}
          whileHover="hover"
          whileTap="tap"
          className="self-start sm:self-center px-4 py-2 bg-surface hover:bg-surface/80 border border-primary/20 rounded-xl text-xs font-semibold text-text flex items-center gap-1.5 transition-all shadow"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </motion.button>
      </motion.div>

      {/* Action alerts */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-3 ${
              actionMessage.type === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-danger/10 border-danger/20 text-danger'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-semibold underline hover:text-text"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat grid widgets (CLICKABLE) */}
      <motion.div 
        variants={staggerContainer} initial="hidden" animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {statCards.map((card) => (
          <motion.div 
            variants={staggerItem} 
            key={card.title} 
            onClick={() => handleCardClick(card.tab, card.filter)}
            className={`glass-panel rounded-xl p-5 border flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:scale-[1.03] shadow-sm hover:shadow-lg group relative ${card.color}`}
            title={`Click to view ${card.title}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">{card.title}</span>
              <card.icon className="h-5 w-5 opacity-80 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-text tracking-tight">{card.value}</span>
              <span className="text-[11px] font-semibold text-primary underline opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                View &rarr;
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'messages', label: `Contact Messages (${data?.stats.unread_messages ? `${data.stats.unread_messages} Unread` : (data?.contact_messages?.length ?? 0)})` },
          { id: 'users', label: `Registered Users (${data?.stats.total_users ?? 0})` },
          { id: 'items', label: 'Manage Items' },
          { id: 'trash', label: 'Trash (Recovery Center)' },
          { id: 'logs', label: 'Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="glass-panel rounded-xl p-6 relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={TRANSITION_BASE}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text uppercase tracking-wider font-heading">Recent Listings</h3>
                  <button onClick={() => setActiveTab('items')} className="text-xs font-semibold text-primary hover:underline">View All &rarr;</button>
                </div>
                <div className="space-y-3">
                  {data?.recent_items.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-surface border border-primary/10 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-text">{item.title}</h4>
                        <p className="text-xs text-textSecondary mt-0.5">{item.category} • {item.location}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-xl text-[10px] font-extrabold uppercase ${
                        item.status === 'Lost' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text uppercase tracking-wider font-heading">Security Audit Preview</h3>
                  <button onClick={() => setActiveTab('logs')} className="text-xs font-semibold text-primary hover:underline">View Logs &rarr;</button>
                </div>
                <div className="space-y-3">
                  {data?.logs.slice(0, 5).map((log, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface border border-primary/10 shadow-sm flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between text-textSecondary">
                        <span className="font-semibold">{log.user}</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                      <p className={`font-medium ${
                        log.action.includes('Security Alert') ? 'text-danger' : 'text-text'
                      }`}>
                        {log.action} {log.item_title && `• ${log.item_title}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* CONTACT MESSAGES TAB */}
          {activeTab === 'messages' && (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={TRANSITION_BASE}
              className="space-y-6"
            >
              {/* Header and Controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface/50 p-4 rounded-xl border border-primary/10">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="text"
                    value={msgSearchQuery}
                    onChange={(e) => { setMsgSearchQuery(e.target.value); setMsgPage(1); }}
                    placeholder="Search contact messages by sender name, email, subject, or content..."
                    className="glass-input pl-10 pr-10 w-full text-sm"
                  />
                  {msgSearchQuery && (
                    <button 
                      onClick={() => setMsgSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-text"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  <Filter className="h-4 w-4 text-textSecondary flex-shrink-0" />
                  {(['all', 'unread', 'read'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => { setMsgStatusFilter(status); setMsgPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                        msgStatusFilter === status
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface text-textSecondary hover:text-text hover:bg-surface/80 border border-primary/10'
                      }`}
                    >
                      {status === 'all' ? 'All Messages' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Cards List */}
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12 bg-surface/30 rounded-xl border border-primary/10">
                  <MessageSquare className="h-10 w-10 text-textSecondary mx-auto mb-3 opacity-40" />
                  <p className="text-text font-semibold text-base">No contact messages found</p>
                  <p className="text-textSecondary text-xs mt-1">When users submit support requests via the Contact page, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.slice((msgPage - 1) * itemsPerPage, msgPage * itemsPerPage).map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-5 rounded-xl border transition-all ${
                        msg.status === 'Unread'
                          ? 'bg-indigo-500/5 border-indigo-500/30 shadow-md'
                          : 'bg-surface/60 border-primary/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            msg.status === 'Unread' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-primary/10 text-primary'
                          }`}>
                            {msg.name ? msg.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-text text-sm">{msg.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                msg.status === 'Unread' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-surface text-textSecondary border border-white/10'
                              }`}>
                                {msg.status}
                              </span>
                            </div>
                            <a href={`mailto:${msg.email}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              <span>{msg.email}</span>
                            </a>
                          </div>
                        </div>

                        <span className="text-xs text-textMuted flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(msg.date)}
                        </span>
                      </div>

                      <div className="py-3 space-y-1.5">
                        <h5 className="text-sm font-bold text-text flex items-center gap-2">
                          <span className="text-textSecondary font-normal">Subject:</span>
                          <span>{msg.subject}</span>
                        </h5>
                        <p className="text-xs text-textSecondary leading-relaxed whitespace-pre-wrap bg-surface/80 p-3 rounded-lg border border-white/5">
                          {msg.message}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        {msg.status === 'Unread' && (
                          <button
                            onClick={() => handleMarkMessageRead(msg.id)}
                            className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Mark as Read</span>
                          </button>
                        )}
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Reply via Email</span>
                        </a>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-3 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Trash className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredMessages.length > itemsPerPage && (
                    <div className="flex justify-between items-center py-3 text-sm">
                      <button 
                        disabled={msgPage === 1}
                        onClick={() => setMsgPage(p => p - 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-textSecondary">
                        Page {msgPage} of {Math.ceil(filteredMessages.length / itemsPerPage)}
                      </span>
                      <button 
                        disabled={msgPage >= Math.ceil(filteredMessages.length / itemsPerPage)}
                        onClick={() => setMsgPage(p => p + 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* REGISTERED USERS TAB */}
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={TRANSITION_BASE}
              className="space-y-6"
            >
              {/* Header and Search Controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface/50 p-4 rounded-xl border border-primary/10">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => { setUserSearchQuery(e.target.value); setUsersPage(1); }}
                    placeholder="Search users by name, email, or role..."
                    className="glass-input pl-10 pr-10 w-full text-sm"
                  />
                  {userSearchQuery && (
                    <button 
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-text"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <Filter className="h-4 w-4 text-textSecondary hidden sm:block" />
                  <div className="flex bg-surface border border-primary/10 rounded-xl p-1 text-xs">
                    {(['all', 'admin', 'user'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => { setUserRoleFilter(role); setUsersPage(1); }}
                        className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                          userRoleFilter === role
                            ? 'bg-primary text-white shadow'
                            : 'text-textSecondary hover:text-text'
                        }`}
                      >
                        {role === 'all' ? 'All Roles' : role === 'admin' ? 'Admins' : 'Users'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Users List / Table */}
              <div className="overflow-x-auto -mx-6">
                <div className="inline-block min-w-full align-middle px-6">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-textSecondary text-sm space-y-3">
                      <Users className="h-10 w-10 text-textMuted mx-auto" />
                      <p>No registered users found matching "{userSearchQuery}".</p>
                      {userSearchQuery && (
                        <button 
                          onClick={() => { setUserSearchQuery(''); setUserRoleFilter('all'); }}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20"
                        >
                          Clear Search Filter
                        </button>
                      )}
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-primary/10 text-sm text-left">
                      <thead>
                        <tr className="text-textSecondary font-semibold text-xs uppercase tracking-wider border-b border-primary/10">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Auth Method</th>
                          <th className="py-3 px-4">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {filteredUsers.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage).map((user) => (
                          <tr key={user.id} className="hover:bg-surface/80 transition-all text-text">
                            <td className="py-3.5 px-4 font-bold flex items-center gap-3">
                              {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.username} className="h-8 w-8 rounded-full object-cover border border-primary/20" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-xs">
                                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                              <span>{user.username}</span>
                            </td>
                            <td className="py-3.5 px-4 text-textSecondary font-mono text-xs">{user.email}</td>
                            <td className="py-3.5 px-4">
                              {user.is_admin || user.role === 'admin' ? (
                                <span className="px-2.5 py-1 bg-primary/15 text-primary border border-primary/20 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Admin
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-surface border border-primary/10 text-textSecondary rounded-lg text-xs font-medium inline-flex items-center gap-1">
                                  <UserCheck className="h-3.5 w-3.5 text-textMuted" />
                                  Student / User
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 bg-surface/80 border border-primary/10 text-textSecondary rounded-md text-xs font-semibold capitalize">
                                {user.auth_provider === 'google' ? 'Google OAuth' : 'Local Auth'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-textSecondary text-xs">{formatDate(user.lastLogin || user.date_created)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Pagination */}
                  {filteredUsers.length > itemsPerPage && (
                    <div className="flex justify-between items-center py-4 px-6 text-sm">
                      <button 
                        disabled={usersPage === 1}
                        onClick={() => setUsersPage(p => p - 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 text-xs font-semibold"
                      >
                        Previous
                      </button>
                      <span className="text-textSecondary text-xs">
                        Page {usersPage} of {Math.ceil(filteredUsers.length / itemsPerPage)}
                      </span>
                      <button 
                        disabled={usersPage >= Math.ceil(filteredUsers.length / itemsPerPage)}
                        onClick={() => setUsersPage(p => p + 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 text-xs font-semibold"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ITEMS TAB */}
          {activeTab === 'items' && (
            <motion.div 
              key="items"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={TRANSITION_BASE}
              className="space-y-4"
            >
              {/* Item Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={(e) => { setItemSearchQuery(e.target.value); setItemsPage(1); }}
                  placeholder="Search items by title, category, location, or reporter..."
                  className="glass-input pl-10 pr-10 w-full text-sm"
                />
                {itemSearchQuery && (
                  <button 
                    onClick={() => setItemSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto -mx-6">
                <div className="inline-block min-w-full align-middle px-6">
                  {filteredItems.length === 0 ? (
                    <p className="text-center py-6 text-textSecondary text-sm">No items matching "{itemSearchQuery}".</p>
                  ) : (
                    <table className="min-w-full divide-y divide-primary/10 text-sm text-left">
                      <thead>
                        <tr className="text-textSecondary font-semibold text-xs uppercase tracking-wider border-b border-primary/10">
                          <th className="py-3 px-4">Item Details</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Reporter</th>
                          <th className="py-3 px-4">Listed Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {filteredItems.slice((itemsPage - 1) * itemsPerPage, itemsPage * itemsPerPage).map((item) => (
                          <tr key={item.id} className="hover:bg-surface/80 transition-all text-text">
                            <td className="py-3.5 px-4 font-bold max-w-[200px] truncate">{item.title}</td>
                            <td className="py-3.5 px-4">{item.category}</td>
                            <td className="py-3.5 px-4">{item.location}</td>
                            <td className="py-3.5 px-4 truncate max-w-[150px]">{item.reporter_email}</td>
                            <td className="py-3.5 px-4">{formatDate(item.date)}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 rounded-lg text-textMuted hover:text-danger hover:bg-danger/5 transition-all"
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

                  {filteredItems.length > itemsPerPage && (
                    <div className="flex justify-between items-center py-4 px-6 text-sm">
                      <button 
                        disabled={itemsPage === 1}
                        onClick={() => setItemsPage(p => p - 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-textSecondary">
                        Page {itemsPage} of {Math.ceil(filteredItems.length / itemsPerPage)}
                      </span>
                      <button 
                        disabled={itemsPage >= Math.ceil(filteredItems.length / itemsPerPage)}
                        onClick={() => setItemsPage(p => p + 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TRASH TAB */}
          {activeTab === 'trash' && (
            <motion.div 
              key="trash"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={TRANSITION_BASE}
              className="overflow-x-auto -mx-6"
            >
              <div className="inline-block min-w-full align-middle px-6">
                {data?.trash_items.length === 0 ? (
                  <div className="text-center py-8 text-textSecondary text-sm">
                    <Archive className="h-10 w-10 text-textMuted mx-auto mb-2" />
                    <p>Trash is empty. Soft deleted listings are saved here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 border border-primary/10 text-primary text-xs rounded-xl flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Soft deleted items are retained here for up to 10 days before automatic permanent collection purge.</span>
                    </div>

                    <table className="min-w-full divide-y divide-primary/10 text-sm text-left">
                      <thead>
                        <tr className="text-textSecondary font-semibold text-xs uppercase tracking-wider border-b border-primary/10">
                          <th className="py-3 px-4">Item Title</th>
                          <th className="py-3 px-4">Previous Status</th>
                          <th className="py-3 px-4">Deleted On</th>
                          <th className="py-3 px-4">Days in Trash</th>
                          <th className="py-3 px-4 text-right">Recovery Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {data?.trash_items.map((item) => (
                          <tr key={item.id} className="hover:bg-surface/80 transition-all text-text">
                            <td className="py-3.5 px-4 font-bold">{item.title}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 bg-primary/10 text-textSecondary rounded-xl text-xs">
                                {item.previous_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">{formatDate(item.deleted_at)}</td>
                            <td className="py-3.5 px-4 font-semibold">
                              {item.days_deleted !== null ? (
                                <span className={item.days_deleted >= 9 ? 'text-danger' : 'text-textSecondary'}>
                                  {item.days_deleted} / 10 days
                                </span>
                              ) : (
                                'Unknown'
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleRecoverItem(item.id)}
                                className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ml-auto"
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
            </motion.div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={TRANSITION_BASE}
              className="space-y-4"
            >
              {/* Log Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => { setLogSearchQuery(e.target.value); setLogsPage(1); }}
                  placeholder="Search logs by action event, user, or entity reference..."
                  className="glass-input pl-10 pr-10 w-full text-sm"
                />
                {logSearchQuery && (
                  <button 
                    onClick={() => setLogSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto -mx-6">
                <div className="inline-block min-w-full align-middle px-6">
                  {filteredLogs.length === 0 ? (
                    <p className="text-center py-6 text-textSecondary text-sm">No audit logs matching "{logSearchQuery}".</p>
                  ) : (
                    <table className="min-w-full divide-y divide-primary/10 text-sm text-left">
                      <thead>
                        <tr className="text-textSecondary font-semibold text-xs uppercase tracking-wider border-b border-primary/10">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Action Event</th>
                          <th className="py-3 px-4">Entity reference</th>
                          <th className="py-3 px-4">Operator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {filteredLogs.slice((logsPage - 1) * itemsPerPage, logsPage * itemsPerPage).map((log, i) => (
                          <tr key={i} className="hover:bg-surface/80 transition-all text-text">
                            <td className="py-3.5 px-4 font-medium flex items-center gap-1.5 text-textMuted">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(log.timestamp)}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`font-semibold ${
                                log.action.includes('Security Alert') ? 'text-danger' : 'text-text'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">{log.item_title || 'N/A'}</td>
                            <td className="py-3.5 px-4 truncate max-w-[150px] font-semibold text-primary">{log.user}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {filteredLogs.length > itemsPerPage && (
                    <div className="flex justify-between items-center py-4 px-6 text-sm">
                      <button 
                        disabled={logsPage === 1}
                        onClick={() => setLogsPage(p => p - 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-textSecondary">
                        Page {logsPage} of {Math.ceil(filteredLogs.length / itemsPerPage)}
                      </span>
                      <button 
                        disabled={logsPage >= Math.ceil(filteredLogs.length / itemsPerPage)}
                        onClick={() => setLogsPage(p => p + 1)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Admin;
