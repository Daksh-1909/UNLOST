import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional, can be by email if user not registered yet
  },
  user_email: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', notificationSchema, 'notifications');

export default Notification;
