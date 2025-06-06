import Tag from '../models/Tag.js';
import { slugify } from '../utils/slugify.js';

// Get all tags
const getAllTags = async (req, res, next) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new tag (protected)
const createTag = async (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = slugify(name);
    const tag = new Tag({ name, slug });
    await tag.save();
    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

// Update a tag (protected)
const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updates = { name };
    if (name) updates.slug = slugify(name);
    const tag = await Tag.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
      });
    }
    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a tag (protected)
const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
      });
    }
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
};