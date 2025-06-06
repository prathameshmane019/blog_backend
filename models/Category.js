import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Category', categorySchema);