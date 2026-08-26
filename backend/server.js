import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import passport from './passport.js';
import apiRouter from './routes/api.js';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Vercel/Netlify HTTPS reverse proxies
app.set('trust proxy', 1);

// Enable CORS with explicit origin validation & credentials support
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://unlost-app.netlify.app',
  'https://unlost-personal.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve static uploads
app.use('/static', express.static(path.join(__dirname, 'static')));

// Connect to MongoDB (optimized connection caching for serverless)
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unlost';

let cachedDbPromise = null;
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (!cachedDbPromise) {
    cachedDbPromise = mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }).catch(err => {
      cachedDbPromise = null;
      throw err;
    });
  }
  await cachedDbPromise;
}

// Middleware to ensure DB connection per request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ success: false, message: 'Database connection failed.' });
  }
});

// Route handler
app.use('/', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'An unexpected error occurred. Please try again later.'
  });
});

// Start listening for local development
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
