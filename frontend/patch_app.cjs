const fs = require('fs');

let appCode = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// 1. Add imports
if (!appCode.includes('ItemDetail')) {
  appCode = appCode.replace(
    /import SmiloPage from '\.\/pages\/SmiloPage';/,
    "import SmiloPage from './pages/SmiloPage';\nimport ItemDetail from './pages/ItemDetail';\nimport AdminAnalytics from './pages/AdminAnalytics';"
  );
}

// 2. Add routes before fallback
if (!appCode.includes('/item/:id')) {
  appCode = appCode.replace(
    /{\/\* Fallback to home \*\//,
    `<Route path="/item/:id" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <ItemDetail />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute requireAdmin>
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} className="w-full h-full">
              <AdminAnalytics />
            </motion.div>
          </ProtectedRoute>
        } />
        
        {/* Fallback to home */`
  );
}

fs.writeFileSync('frontend/src/App.tsx', appCode);
console.log('Successfully patched App.tsx');
