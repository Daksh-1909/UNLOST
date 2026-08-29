import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Lost', 'Found', 'Claimed', 'Returned', 'Archived'],
    default: 'Lost'
  },
  claimant_email: {
    type: String
  },
  claim_answers: {
    type: mongoose.Schema.Types.Mixed
  },
  contact_info: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  image_file: {
    type: String
  },
  security_question: {
    type: String
  },
  security_answer: {
    type: String
  },
  reporter_email: {
    type: String,
    default: 'Anonymous'
  }
});

itemSchema.index({ status: 1, date: -1 });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ date: -1 });
itemSchema.index({ title: 'text', description: 'text' });

const Item = mongoose.model('Item', itemSchema, 'items');

export default Item;
