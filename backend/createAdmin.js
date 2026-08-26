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

const User = mongoose.models.User || mongoose.model('User', userSchema);

const createAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminsToCreate = [
      {
        email: process.env.ADMIN_EMAIL || 'dakshp860@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'daksh2308',
        username: 'SystemAdmin'
      },
      {
        email: 'shlokapatel20@gmail.com',
        password: '123456',
        username: 'ShlokaPatel'
      },
      {
        email: 'rudraprajapati1819@gmail.com',
        password: '123456',
        username: 'RudraPrajapati'
      }
    ];

    for (const adminData of adminsToCreate) {
      if (!adminData.email || !adminData.password) {
        console.warn(`Skipping invalid admin entry: ${JSON.stringify(adminData)}`);
        continue;
      }

      let user = await User.findOne({ email: adminData.email.toLowerCase() });
      if (user) {
        console.log(`Admin user '${adminData.email}' already exists. Updating password and roles...`);
      } else {
        user = new User({
          email: adminData.email.toLowerCase(),
          username: adminData.username
        });
      }

      user.password = await bcrypt.hash(adminData.password, 10);
      user.is_admin = true;
      user.role = 'admin';

      await user.save();
      console.log(`Admin user created/updated successfully! Email: ${adminData.email}`);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Error creating admins:', err);
    process.exit(1);
  }
};

createAdmins();
