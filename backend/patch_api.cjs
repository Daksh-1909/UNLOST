const fs = require('fs');

let apiJs = fs.readFileSync('backend/routes/api.js', 'utf8');

// 1. Add imports at the top
if (!apiJs.includes('Notification.js')) {
  apiJs = apiJs.replace(
    /import Item from '\.\.\/models\/Item\.js';/,
    "import Item from '../models/Item.js';\nimport Notification from '../models/Notification.js';\nimport { findMatchesAndNotify } from '../utils/matcher.js';"
  );
}

// 2. Patch POST /api/report
if (!apiJs.includes('findMatchesAndNotify(newItem)')) {
  apiJs = apiJs.replace(
    /await newItem\.save\(\);/,
    "await newItem.save();\n\n    // Run matching engine and notify\n    const matches = await findMatchesAndNotify(newItem);\n    const matchIds = matches.map(m => m.item._id);"
  );

  apiJs = apiJs.replace(
    /res\.status\(200\)\.json\(\{ success: true, message: 'Report submitted successfully!' \}\);/,
    "res.status(200).json({ success: true, message: 'Report submitted successfully!', matches: matchIds, itemId: newItem._id });"
  );
}

// 3. Append new endpoints
const newEndpoints = `

// --- NEW ENDPOINTS FOR UNLOST FEATURES ---

// GET /api/items/:id
router.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching item' });
  }
});

// GET /api/items/:id/matches
router.get('/api/items/:id/matches', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    const matches = await findMatchesAndNotify(item); // Note: re-running matcher doesn't duplicate notifications due to logic, but normally we just find.
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching matches' });
  }
});

// POST /api/items/:id/claim
router.post('/api/items/:id/claim', loginRequired, async (req, res) => {
  try {
    const { answer } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    item.status = 'Claimed';
    item.claim_answers = { answer, timestamp: new Date() };
    const user = await User.findById(req.userId);
    item.claimant_email = user.email;
    await item.save();
    
    // Log
    await new Log({ action: \`Claim submitted for \${item.title}\`, user: user.email }).save();
    
    res.json({ success: true, message: 'Claim submitted successfully for admin review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error submitting claim' });
  }
});

// POST /api/admin/items/:id/approve-claim
router.post('/api/admin/items/:id/approve-claim', adminRequired, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    item.status = 'Returned';
    await item.save();
    
    const user = await User.findById(req.userId);
    await new Log({ action: \`Approved claim for \${item.title}\`, user: user.email }).save();
    
    res.json({ success: true, message: 'Claim approved. Item marked as returned.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error approving claim' });
  }
});

// GET /api/notifications
router.get('/api/notifications', loginRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const notifications = await Notification.find({ user_email: user.email }).sort({ date: -1 }).limit(20);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/api/notifications/:id/read', loginRequired, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating notification' });
  }
});

// GET /api/admin/analytics
router.get('/api/admin/analytics', adminRequired, async (req, res) => {
  try {
    const items = await Item.find({});
    
    const totalItems = items.length;
    const statusCounts = {
      Lost: items.filter(i => i.status === 'Lost').length,
      Found: items.filter(i => i.status === 'Found').length,
      Claimed: items.filter(i => i.status === 'Claimed').length,
      Returned: items.filter(i => i.status === 'Returned').length,
      Archived: items.filter(i => i.status === 'Archived').length,
    };
    
    const categories = {};
    items.forEach(i => {
      categories[i.category] = (categories[i.category] || 0) + 1;
    });
    
    const claimsPending = items.filter(i => i.status === 'Claimed');
    
    res.json({ success: true, analytics: { totalItems, statusCounts, categories: Object.entries(categories).map(([name, value]) => ({name, value})), claimsPending } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
});

export default router;
`;

if (!apiJs.includes('/api/items/:id/matches')) {
  apiJs = apiJs.replace(/export default router;/, newEndpoints);
  fs.writeFileSync('backend/routes/api.js', apiJs);
  console.log('Successfully patched api.js');
} else {
  console.log('api.js already patched');
}
