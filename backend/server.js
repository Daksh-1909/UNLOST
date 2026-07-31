import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
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

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve static uploads
app.use('/static', express.static(path.join(__dirname, 'static')));

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unlost';
console.log(`Connecting to MongoDB...`);

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const sessionSecret = process.env.SECRET_KEY || 'unlost_session_secret_123';
if (process.env.NODE_ENV === 'production' && !process.env.SECRET_KEY) {
  console.warn('WARNING: SECRET_KEY is not defined in production.');
}

// Session configuration
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Route handler
app.use('/', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
