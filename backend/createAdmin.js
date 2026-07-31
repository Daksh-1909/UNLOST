import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  is_admin: { type: Boolean, default: false },
  role: { type: String, default: 'user' },
  google_id: { type: String },
  profilePicture: { type: String }
});

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set.');
      process.exit(1);
    }
    
    // Check if exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin user already exists. Updating password and roles...');
    } else {
      user = new User({ email, username: 'SystemAdmin' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.is_admin = true;
    user.role = 'admin';

    await user.save();
    console.log('Admin user created/updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
