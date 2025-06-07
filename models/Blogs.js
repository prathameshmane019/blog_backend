import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200,
  },
  excerpt: {
    type: String
  },
  status: {
    type: String
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    },
  ],
  author: {
    type: String,
    required: true,
  },
  viewsCount: {
    type: Number,
    default: 0,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  images: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      position: { type: Number, default: 0 }, // Position in content
      altText: { type: String, default: '' }, // Alt text for accessibility
      caption: { type: String, default: '' }, // Caption for the image
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

blogSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('Blog', blogSchema);