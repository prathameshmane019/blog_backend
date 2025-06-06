import Category from '../models/Category.js';
import { slugify } from '../utils/slugify.js'; // Utility to create slugs

// Get all categories
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new category (protected)
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(name);
    const category = new Category({ name, slug, description });
    await category.save();
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Update a category (protected)
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updates = { name, description };
    if (name) updates.slug = slugify(name);
    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a category (protected)
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
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
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};