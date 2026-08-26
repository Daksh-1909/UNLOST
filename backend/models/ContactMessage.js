import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'Unread', enum: ['Unread', 'Read', 'Replied'] },
  user_email: { type: String, default: null }
});

const ContactMessage = mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);

export default ContactMessage;
