const fs = require('fs');

let navbarCode = fs.readFileSync('frontend/src/components/Navbar.tsx', 'utf8');

// 1. Add lucide icons
navbarCode = navbarCode.replace(
  /import { Menu, X, LogOut, LayoutGrid, PlusCircle, Shield, User, Phone, Home, ChevronDown } from 'lucide-react';/,
  "import { Menu, X, LogOut, LayoutGrid, PlusCircle, Shield, User, Phone, Home, ChevronDown, Sun, Moon, Bell } from 'lucide-react';"
);

// 2. Add React hooks for dark mode and notifications
if (!navbarCode.includes('isDark')) {
  navbarCode = navbarCode.replace(
    /const \[isDropdownOpen, setIsDropdownOpen\] = useState\(false\);/,
    `const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  React.useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotifications(data.notifications);
          }
        });
    }
  }, [user]);

  const markAsRead = async (id) => {
    await fetch(\`/api/notifications/\${id}/read\`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };`
  );
}

// 3. Add UI components next to profile
if (!navbarCode.includes('<Bell className=')) {
  const replacement = `
        <div className="flex items-center space-x-4 ml-4">
          {/* Dark Mode Toggle */}
          <motion.button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full text-textSecondary hover:text-text hover:bg-white/10 transition-colors"
            whileHover="hover"
            whileTap="tap"
            variants={tapHoverVariants}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-full text-textSecondary hover:text-text hover:bg-white/10 transition-colors relative"
              whileHover="hover"
              whileTap="tap"
              variants={tapHoverVariants}
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full animate-pulse" />
              )}
            </motion.button>
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={TRANSITION_BASE}
                  className="absolute right-0 mt-2 w-80 bg-surface rounded-xl shadow-xl border border-white/10 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-white/5 font-bold text-text">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-textSecondary">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          className={\`p-3 border-b border-white/5 text-sm transition-colors \${n.isRead ? 'opacity-60' : 'bg-primary/5 hover:bg-primary/10 cursor-pointer'}\`}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n._id);
                            if (n.link) window.location.href = n.link;
                          }}
                        >
                          <p className="text-text">{n.message}</p>
                          <span className="text-xs text-textSecondary">{new Date(n.date).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-border/30 mx-2 hidden md:block"></div>
`;

  navbarCode = navbarCode.replace(
    /<div className="h-4 w-px bg-white\/10 mx-2"><\/div>/,
    replacement
  );
}

fs.writeFileSync('frontend/src/components/Navbar.tsx', navbarCode);
console.log('Successfully patched Navbar.tsx');
