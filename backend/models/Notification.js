import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  user_email: {
    type: String,
    required: false
  },
  title: {
    type: String,
    default: 'Notification'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['item_lost', 'item_found', 'match', 'claim', 'admin_alert', 'general'],
    default: 'general'
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: false
  },
  item_status: {
    type: String,
    enum: ['Lost', 'Found', 'Claimed', 'Returned', 'Archived'],
    required: false
  },
  item_category: {
    type: String,
    required: false
  },
  item_location: {
    type: String,
    required: false
  },
  item_image: {
    type: String,
    required: false
  },
  link: {
    type: String
  },
  isBroadcast: {
    type: Boolean,
    default: false
  },
  forAdmin: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for high-performance notification querying
notificationSchema.index({ date: -1 });
notificationSchema.index({ user_email: 1, date: -1 });
notificationSchema.index({ isBroadcast: 1, date: -1 });
notificationSchema.index({ forAdmin: 1, date: -1 });

const Notification = mongoose.model('Notification', notificationSchema, 'notifications');

export default Notification;

