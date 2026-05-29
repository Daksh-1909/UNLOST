import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Calendar, Clock, Shield, Activity, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileLog {
  action: string;
  item_title: string;
  timestamp: string;
  item_id: string;
}

interface ProfileData {
  user: {
    username: string;
    email: string;
    date_created: string | null;
  };
  logs: ProfileLog[];
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        if (response.ok && data.success) {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-white tracking-tight">Your Profile</h1>
        <p className="text-sm text-slate-400">Manage account information and view your activity logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-6 flex flex-col items-center text-center space-y-5 md:col-span-1"
        >
          {/* Avatar sphere */}
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 select-none">
            <span className="text-3xl font-extrabold text-white uppercase font-heading">
              {user?.username.slice(0, 2)}
            </span>
            {user?.is_admin && (
              <span className="absolute bottom-0 right-0 p-1.5 bg-indigo-500 rounded-full border-2 border-slate-900 shadow text-white" title="Admin Account">
                <Shield className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold font-heading text-white">{user?.username}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold select-none ${
              user?.is_admin
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border border-white/5'
            }`}>
              {user?.is_admin ? 'Administrator' : 'Student Account'}
            </span>
          </div>

          <div className="w-full text-left space-y-3 pt-4 border-t border-white/5 text-sm text-slate-300">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4.5 w-4.5 text-slate-500 flex-shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4.5 w-4.5 text-slate-500 flex-shrink-0" />
              <span>Created {formatDate(profileData?.user.date_created || null)}</span>
            </div>
          </div>
        </motion.div>

        {/* Activity Logs */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Activity className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-bold font-heading text-white">Recent Activity</h3>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 rounded-xl bg-slate-800/20 animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : !profileData?.logs || profileData.logs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <FileText className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                <p>No activity logs found under this account.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {profileData.logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-200">
                        {log.action}
                      </p>
                      {log.item_title && (
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <FileText className="h-3 w-3 text-slate-500" />
                          <span>Reference: {log.item_title}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:text-right flex-shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
