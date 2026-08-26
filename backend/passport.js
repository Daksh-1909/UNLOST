import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import GoogleTokenStrategy from 'passport-google-id-token';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

// Extractor function to get JWT from the 'token' cookie
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.token;
  }
  return token;
};

// 1. Local Strategy (for /api/login)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'Bad email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Bad email or password' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// 2. JWT Strategy (for loginRequired / adminRequired)
passport.use(new JwtStrategy({
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET_KEY || 'jwtsecret123'
}, async (jwtPayload, done) => {
  try {
    // Return the payload structure exactly as the old jwt.verify decoded it.
    // We don't strictly need to do a DB lookup here for performance, 
    // since the payload itself contains id, email, role, is_admin.
    // The previous implementation just decoded the token.
    return done(null, {
      id: jwtPayload.id,
      email: jwtPayload.email,
      role: jwtPayload.role,
      is_admin: jwtPayload.is_admin
    });
  } catch (error) {
    return done(error, false);
  }
}));

// 3. Google ID Token Strategy (for /api/auth/google)
passport.use(new GoogleTokenStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID
}, async (parsedToken, googleId, done) => {
  try {
    const { email, name, picture } = parsedToken.payload;
    
    const adminEmails = [
      (process.env.ADMIN_EMAIL || 'dakshp860@gmail.com').toLowerCase(),
      'shlokapatel20@gmail.com',
      'rudraprajapati1819@gmail.com',
      'admin@unlost.com'
    ];
    const isAdmin = email && adminEmails.includes(email.toLowerCase());
    let user = await User.findOne({ email });
    if (user) {
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
      }
      if (isAdmin) {
        user.is_admin = true;
        user.role = 'admin';
      }
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    } else {
      const username = name || email.split('@')[0];
      user = new User({
        username,
        email,
        auth_provider: 'google',
        google_id: googleId,
        profilePicture: picture,
        role: isAdmin ? 'admin' : 'user',
        is_admin: isAdmin,
        lastLogin: new Date()
      });
      await user.save();
      return done(null, user);
    }
  } catch (error) {
    return done(error, false);
  }
}));

export default passport;
