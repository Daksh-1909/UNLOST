import express from 'express';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Notification from '../models/Notification.js';
import { findMatchesAndNotify } from '../utils/matcher.js';
import Log from '../models/Log.js';
import ContactMessage from '../models/ContactMessage.js';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';

const jwtSecretKey = process.env.JWT_SECRET_KEY;
if (process.env.NODE_ENV === 'production' && !jwtSecretKey) {
  console.error('FATAL ERROR: JWT_SECRET_KEY is not defined in production.');
  process.exit(1);
}
const JWT_SECRET = jwtSecretKey || 'jwtsecret123';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many verification attempts, please try again later.' }
});

const ADMIN_EMAILS = [
  'shlokapatel20@gmail.com',
  'rudraprajapati1819@gmail.com',
  'admin@unlost.com'
];

const validateParulEmail = (email) => {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower.endsWith('@paruluniversity.ac.in') || ADMIN_EMAILS.includes(lower);
};

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer memory storage for serverless/local cross-platform compatibility
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || (file.mimetype && file.mimetype.startsWith('image/'))) {
      cb(null, true);
    } else {
      cb(new Error('Only images (png, jpg, jpeg, gif, webp) are allowed'));
    }
  }
});

// Middleware to handle multer errors gracefully
const uploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('image');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// --- Authentication Middlewares ---
const loginRequired = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
    req.userId = user.id;
    req.user = user;
    next();
  })(req, res, next);
};

const adminRequired = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
    if (user.role === 'admin' || user.is_admin) {
      req.userId = user.id;
      req.user = user;
      next();
    } else {
      res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
    }
  })(req, res, next);
};

// --- Google OAuth / JWT Auth ---
const generateJWT = (user) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

router.post('/api/auth/google', (req, res, next) => {
  if (!req.body.token && req.body.credential) {
    // Handling standard OAuth2 library token names just in case
    req.body.id_token = req.body.credential;
  } else if (req.body.token) {
    req.body.id_token = req.body.token;
  }

  passport.authenticate('google-id-token', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error('Google OAuth error:', err || info);
      return res.status(401).json({ success: false, message: 'Google authentication failed.' });
    }

    if (!validateParulEmail(user.email)) {
      return res.status(403).json({ success: false, message: 'Only @paruluniversity.ac.in emails are allowed.' });
    }

    const jwtToken = generateJWT(user);
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        is_admin: user.is_admin,
        profilePicture: user.profilePicture
      }
    });
  })(req, res, next);
});

// --- Regular Local Authentication ---

// GET /api/user
router.get('/api/user', async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        return res.status(200).json({
          authenticated: true,
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            is_admin: user.is_admin,
            role: user.role,
            profilePicture: user.profilePicture
          }
        });
      }
    } catch (e) {}
  }
  res.status(200).json({ authenticated: false });
});

// POST /api/register
router.post('/api/register', authRateLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing username, email or password' });
  }

  if (!validateParulEmail(email)) {
    return res.status(403).json({ success: false, message: 'Only @paruluniversity.ac.in emails are allowed to register.' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      is_admin: false
    });
    await user.save();

    res.status(200).json({ success: true, message: 'Account created successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database registration failed.' });
  }
});

// POST /api/login
router.post('/api/login', authRateLimiter, (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Authentication error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: info?.message || 'Bad email or password' });
    }

    try {
      const jwtToken = generateJWT(user);
      res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }).catch(err => console.error('Error updating lastLogin:', err));

      return res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          is_admin: user.is_admin,
          role: user.role,
          profilePicture: user.profilePicture
        }
      });
    } catch (saveErr) {
      return res.status(500).json({ success: false, message: 'Error finalizing login' });
    }
  })(req, res, next);
});

// GET /api/logout
router.get('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/forgot-password
router.post('/api/forgot-password', authRateLimiter, async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully! You can now log in with your new password.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// --- Items and Claims ---

const buildItemsFilter = (query) => {
  const filter = {};

  if (query.q) {
    const regex = new RegExp(query.q, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.date) {
    // Treat date as UTC day boundary
    const dateStr = query.date;
    const startOfDay = new Date(`${dateStr}T00:00:00Z`);
    if (!isNaN(startOfDay.getTime())) {
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      filter.date = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    }
  }

  if (!query.status) {
    filter.status = { $ne: 'Archived' };
  }

  return filter;
};

// GET /api/items
router.get('/api/items', loginRequired, async (req, res) => {
  try {
    const filter = buildItemsFilter(req.query);
    const limit = parseInt(req.query.limit, 10) || 0; // 0 means no limit
    
    let query = Item.find(filter).sort({ date: -1 }).lean();
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const items = await query;

    const formattedItems = items.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      category: doc.category,
      location: doc.location,
      status: doc.status,
      date: doc.date ? (doc.date instanceof Date ? doc.date.toISOString() : doc.date) : null,
      image_file: doc.image_file,
      security_question: doc.security_question,
      has_security_answer: !!doc.security_answer,
      reporter_email: doc.reporter_email || 'Anonymous'
    }));

    res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=20');
    res.status(200).json({ success: true, items: formattedItems });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve items.' });
  }
});

// POST /api/report
router.post('/api/report', loginRequired, uploadMiddleware, async (req, res) => {
  const { title, description, category, location, status, contact_info, date } = req.body;
  if (!title || !description || !category || !location || !status || !contact_info) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const currentUser = await User.findById(req.userId);
    const dateObj = date ? new Date(date) : new Date();

    let imageFileValue = null;
    if (req.file) {
      if (req.file.buffer) {
        const mimeType = req.file.mimetype || 'image/jpeg';
        imageFileValue = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;
      } else if (req.file.filename) {
        imageFileValue = req.file.filename;
      }
    }

    const newItem = new Item({
      title,
      description,
      category,
      location,
      status,
      contact_info,
      date: isNaN(dateObj.getTime()) ? new Date() : dateObj,
      image_file: imageFileValue,
      security_question: req.body.security_question,
      security_answer: req.body.security_answer,
      reporter_email: currentUser.email
    });
    await newItem.save();

    // Run matching engine and notify
    const matches = await findMatchesAndNotify(newItem);
    const matchIds = matches.map(m => m.item._id);

    // Log the report activity
    const newLog = new Log({
      action: `Reported item: ${title}`,
      user: currentUser.email
    });
    await newLog.save();

    res.status(200).json({ success: true, message: 'Report submitted successfully!', matches: matchIds, itemId: newItem._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
});

// POST /api/verify_claim
router.post('/api/verify_claim', loginRequired, verifyRateLimiter, async (req, res) => {
  const targetId = req.body.item_id || req.body.id;
  const { answer } = req.body;
  if (!targetId || !answer) {
    return res.status(400).json({ success: false, message: 'Missing item ID or verification answer' });
  }

  try {
    const item = await Item.findById(targetId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const user = await User.findById(req.userId);

    const cleanInput = answer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ").toLowerCase().trim();
    const cleanDb = item.security_answer ? item.security_answer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ").toLowerCase().trim() : "";

    const isMatch = !item.security_answer || cleanDb === "" || cleanInput === cleanDb;

    if (isMatch) {
      item.status = 'Claimed';
      item.claimant_email = user?.email || 'authenticated_user';
      item.claim_answers = { answer, timestamp: new Date() };
      await item.save();

      if (user) {
        await new Log({ action: `Claim verified for ${item.title}`, user: user.email }).save();
      }

      res.status(200).json({
        success: true,
        message: 'Security check passed! Claim submitted successfully for admin review.',
        contact_info: item.contact_info || item.reporter_email
      });
    } else {
      res.status(200).json({ success: false, message: 'Incorrect answer. Please check your verification detail and try again.' });
    }
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid item ID format' });
    }
    res.status(500).json({ success: false, message: 'Verification error' });
  }
});

// POST /api/chat
router.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message && !history) {
    return res.status(400).json({ success: false, message: 'Message or history is required' });
  }

  try {
    const recentItems = await Item.find({ status: { $ne: 'Archived' } }).sort({ date: -1 }).limit(10);
    const itemsContext = recentItems.map(i => `- ID: ${i._id}, Title: ${i.title}, Category: ${i.category}, Status: ${i.status}, Location: ${i.location}`).join('\n');

    const systemPrompt = `You are Smilo, the friendly AI assistant for the UNLOST portal. 
You help users report lost items or claim found items. Keep answers brief, friendly, and helpful. 
Use emojis where appropriate.
If a user asks about accuracy or statistics, let them know our matching algorithms are highly precise but encourage them to search the portal for specific items.
IMPORTANT: You MUST ONLY answer questions related to the UNLOST portal, lost & found items, or the app's features. If the user asks off-topic, useless, or irrelevant questions, politely decline to answer and steer them back to lost & found topics.
CRITICAL: If a user asks about an item that is NOT explicitly listed in your database context, explicitly encourage them to use the "Report Item" page to submit a new report, or direct them to the "Contact" page if they need administrative help.
Here are the most recent items in the database for your context:
${itemsContext}`;

    let contents;
    if (history && Array.isArray(history)) {
        contents = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        
        while (contents.length > 0 && contents[0].role === 'model') {
            contents.shift();
        }
        
        if (contents.length === 0 && message) {
            contents = [{ role: 'user', parts: [{ text: message }] }];
        } else if (contents.length === 0) {
            contents = [{ role: 'user', parts: [{ text: "Hello" }] }];
        }
    } else {
        contents = [{ role: 'user', parts: [{ text: message || "Hello" }] }];
    }

    // Attempt Gemini Generative AI call if key is available
    try {
      if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('AQ.')) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
            }
        });

        if (response && response.text) {
          return res.status(200).json({ success: true, text: response.text });
        }
      }
    } catch (aiErr) {
      console.warn('Gemini API call skipped or failed, using smart engine:', aiErr.message || aiErr);
    }

    // --- Enhanced Smart Conversational & Search Engine ---
    const queryLower = (message || '').toLowerCase().trim();
    let replyText = '';

    // 1. Check for specific search terms in user message
    const keywords = queryLower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !['show', 'latest', 'items', 'have', 'seen', 'find', 'found', 'lost', 'what', 'where', 'there', 'does', 'anyone', 'which', 'with'].includes(w));
    
    let searchResults = [];
    if (keywords.length > 0) {
      const searchRegex = new RegExp(keywords.join('|'), 'i');
      searchResults = await Item.find({
        status: { $ne: 'Archived' },
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { location: searchRegex }
        ]
      }).limit(5);
    }

    if (searchResults.length > 0) {
      replyText = `🔍 **I found ${searchResults.length} matching item(s) in our database:**\n\n` + 
        searchResults.map(i => `• **${i.title}** (${i.category} — *${i.status}* at ${i.location})`).join('\n') +
        `\n\nView details or claim items on the [Items](/items) page!`;
    } else if (queryLower.includes('latest') || queryLower.includes('recent') || queryLower.includes('show') || queryLower.includes('list') || (queryLower.includes('item') && !keywords.length)) {
      if (recentItems.length > 0) {
        replyText = `📋 **Here are the latest active items reported on UNLOST:**\n\n` + 
          recentItems.map(i => `• **${i.title}** (${i.category} — *${i.status}* at ${i.location})`).join('\n') +
          `\n\nBrowse all listings on the [Items](/items) page or submit a report on the [Report Item](/report) page!`;
      } else {
        replyText = `There are currently no active items reported on UNLOST. You can be the first to report a lost/found item on the [Report Item](/report) page!`;
      }
    } else if (queryLower.includes('report') || queryLower.includes('lost') || queryLower.includes('found') || queryLower.includes('add') || queryLower.includes('submit')) {
      replyText = `📝 **How to Report an Item:**\n1. Go to the [Report Item](/report) page.\n2. Fill in the item title, description, category, location, and contact details.\n3. Add a security question & optional image to verify claims.\n4. Click **Submit Report**!`;
    } else if (queryLower.includes('claim') || queryLower.includes('verify') || queryLower.includes('owner')) {
      replyText = `🔐 **How to Claim a Found Item:**\n1. Browse active listings on the [Items](/items) page.\n2. Click on the item you own and press **Claim Item**.\n3. Answer the security question set by the reporter.\n4. Once verified, the reporter will coordinate returning your item!`;
    } else if (queryLower.includes('contact') || queryLower.includes('help') || queryLower.includes('admin') || queryLower.includes('support')) {
      replyText = `📬 Need help or administrative assistance? Reach out directly to our team via the [Contact](/contact) page!`;
    } else if (queryLower.includes('hi') || queryLower.includes('hello') || queryLower.includes('hey') || queryLower.includes('start')) {
      replyText = `👋 Hi! I'm Smilo, your UNLOST assistant. Ask me to search for lost items (e.g., "AirPods" or "Wallet"), show recent listings, or guide you through reporting & claiming items!`;
    } else if (queryLower.includes('thank')) {
      replyText = `You're very welcome! 😊 Let me know if you need help finding anything else on UNLOST!`;
    } else {
      replyText = `I checked our records! You can search active listings on the [Items](/items) page, or submit a new listing on the [Report Item](/report) page!`;
    }

    return res.status(200).json({ success: true, text: replyText });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(200).json({ 
      success: true, 
      text: "Hi! I'm Smilo. You can search active listings on the [Items](/items) page or submit a new report on the [Report Item](/report) page!" 
    });
  }
});

// GET /api/profile
router.get('/api/profile', loginRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const logs = await Log.find({
      $or: [{ user: user.email }, { admin: user.email }]
    }).sort({ timestamp: -1 }).limit(10);

    const formattedLogs = logs.map(doc => ({
      action: doc.action,
      timestamp: doc.timestamp.toISOString(),
      user: doc.user,
      admin: doc.admin
    }));

    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        date_created: user.date_created ? user.date_created.toISOString() : null
      },
      logs: formattedLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load profile logs.' });
  }
});

// --- Admin Endpoints ---

// GET /api/admin/stats
router.get('/api/admin/stats', adminRequired, async (req, res) => {
  try {
    const activeItemsCount = await Item.countDocuments({ status: { $ne: 'Archived' } });
    const lostItems = await Item.countDocuments({ status: 'Lost' });
    const foundItems = await Item.countDocuments({ status: 'Found' });
    const archivedItems = await Item.countDocuments({ status: 'Archived' });
    const totalUsers = await User.countDocuments({});

    const recentItems = await Item.find({ status: { $ne: 'Archived' } }).sort({ date: -1 }).limit(20);
    const trashItems = await Item.find({ status: 'Archived' }).sort({ date: -1 }).limit(20);
    const logs = await Log.find().sort({ timestamp: -1 }).limit(20);
    const users = await User.find({}, '-password').sort({ date_created: -1, _id: -1 });

    const unreadMessages = await ContactMessage.countDocuments({ status: 'Unread' });
    const contactMessages = await ContactMessage.find({}).sort({ date: -1 });

    res.status(200).json({
      success: true,
      stats: {
        total_items: activeItemsCount,
        total_users: totalUsers,
        lost_items: lostItems,
        found_items: foundItems,
        archived_items: archivedItems,
        unread_messages: unreadMessages,
        new_today: 0,
        security_alerts: 0
      },
      recent_items: recentItems.map(i => ({
        id: i._id.toString(),
        title: i.title,
        category: i.category,
        status: i.status,
        location: i.location,
        date: i.date,
        reporter_email: 'Anonymous'
      })),
      trash_items: trashItems.map(i => ({
        id: i._id.toString(),
        title: i.title,
        previous_status: 'Unknown',
        deleted_at: i.date,
        days_deleted: 0
      })),
      logs: logs.map(l => ({
        action: l.action,
        item_title: l.item_title || 'N/A',
        timestamp: l.timestamp || new Date(),
        user: l.admin || 'System',
        item_id: 'N/A'
      })),
      contact_messages: contactMessages.map(m => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        date: m.date,
        status: m.status,
        user_email: m.user_email
      })),
      users: users.map(u => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        role: u.role || (u.is_admin ? 'admin' : 'user'),
        is_admin: u.is_admin || false,
        auth_provider: u.auth_provider || 'local',
        profilePicture: u.profilePicture || null,
        lastLogin: u.lastLogin || null,
        date_created: u.date_created || null
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users
router.get('/api/admin/users', adminRequired, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ date_created: -1, _id: -1 });
    res.status(200).json({
      success: true,
      users: users.map(u => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        role: u.role || (u.is_admin ? 'admin' : 'user'),
        is_admin: u.is_admin || false,
        auth_provider: u.auth_provider || 'local',
        profilePicture: u.profilePicture || null,
        lastLogin: u.lastLogin || null,
        date_created: u.date_created || null
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// POST /api/admin/delete/:item_id
router.post('/api/admin/delete/:item_id', adminRequired, async (req, res) => {
  const { item_id } = req.params;
  try {
    const item = await Item.findById(item_id);
    if (item) {
      item.status = 'Archived';
      await item.save();

      const newLog = new Log({
        action: `Deleted item (ID: ${item_id})`,
        admin: req.user.email
      });
      await newLog.save();

      res.status(200).json({ success: true, message: 'Item archived successfully.' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found.' });
    }
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid item ID format' });
    }
    res.status(500).json({ success: false, message: 'Failed to archive item.' });
  }
});

// POST /api/admin/recover/:item_id
router.post('/api/admin/recover/:item_id', adminRequired, async (req, res) => {
  const { item_id } = req.params;
  try {
    const item = await Item.findById(item_id);
    if (item && item.status === 'Archived') {
      // Default back to Found as per Flask implementation
      item.status = 'Found';
      await item.save();

      const newLog = new Log({
        action: `Recovered item (ID: ${item_id})`,
        admin: req.user.email
      });
      await newLog.save();

      res.status(200).json({ success: true, message: 'Item recovered successfully.' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found or not in archived state.' });
    }
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid item ID format' });
    }
    res.status(500).json({ success: false, message: 'Failed to recover item.' });
  }
});

// POST /api/admin/permanent-delete/:item_id
router.post('/api/admin/permanent-delete/:item_id', adminRequired, async (req, res) => {
  const { item_id } = req.params;
  try {
    const deletedItem = await Item.findByIdAndDelete(item_id);
    if (deletedItem) {
      const user = await User.findById(req.userId);
      await new Log({
        action: `Permanently deleted item ${deletedItem.title} (ID: ${item_id})`,
        admin: user ? user.email : 'Admin'
      }).save();
      res.status(200).json({ success: true, message: 'Item permanently deleted from database.' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to permanently delete item.' });
  }
});

// POST /api/contact
router.post('/api/contact', loginRequired, async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    const contactMsg = new ContactMessage({
      name,
      email,
      subject,
      message,
      date: new Date(),
      status: 'Unread',
      user_email: req.user ? req.user.email : email
    });
    await contactMsg.save();

    const newLog = new Log({
      action: `Contact Form Submission from ${name}: ${subject}`,
      user: req.user ? req.user.email : email
    });
    await newLog.save();

    res.status(200).json({ success: true, message: 'Message sent successfully to support administrators.' });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

// GET /api/admin/messages
router.get('/api/admin/messages', adminRequired, async (req, res) => {
  try {
    const messages = await ContactMessage.find({}).sort({ date: -1 });
    res.status(200).json({
      success: true,
      messages: messages.map(m => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        date: m.date,
        status: m.status,
        user_email: m.user_email
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch contact messages.' });
  }
});

// POST /api/admin/messages/:id/mark-read
router.post('/api/admin/messages/:id/mark-read', adminRequired, async (req, res) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    msg.status = 'Read';
    await msg.save();
    res.status(200).json({ success: true, message: 'Message marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update message status.' });
  }
});

// POST /api/admin/messages/:id/delete
router.post('/api/admin/messages/:id/delete', adminRequired, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});



// --- NEW ENDPOINTS FOR UNLOST FEATURES ---

// GET /api/items/:id
router.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=20');
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
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User authenticated session missing' });

    item.status = 'Claimed';
    item.claim_answers = { answer, timestamp: new Date() };
    item.claimant_email = user.email;
    await item.save();
    
    // Log
    await new Log({ action: `Claim submitted for ${item.title}`, user: user.email }).save();
    
    res.json({ success: true, message: 'Claim submitted successfully for admin review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error submitting claim' });
  }
});

// DELETE /api/items/:id (User delete own reported item)
router.delete('/api/items/:id', loginRequired, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User session invalid' });

    const isOwner = item.reporter_email && item.reporter_email.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.is_admin || user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only delete items that you reported.' });
    }

    item.status = 'Archived';
    await item.save();

    await new Log({ action: `User deleted item ${item.title}`, user: user.email }).save();

    res.json({ success: true, message: 'Item archived successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting item' });
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
    await new Log({ action: `Approved claim for ${item.title}`, user: user.email }).save();
    
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
    const items = await Item.find({ status: { $ne: 'Archived' } });
    
    const totalItems = items.length;
    const statusCounts = {
      Lost: items.filter(i => i.status === 'Lost').length,
      Found: items.filter(i => i.status === 'Found').length,
      Claimed: items.filter(i => i.status === 'Claimed').length,
      Returned: items.filter(i => i.status === 'Returned').length,
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

