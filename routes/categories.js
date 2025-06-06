import express from 'express';
import CategoryController from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Public route
router.get('/', CategoryController.getAllCategories);

// Protected routes
router.post(
  '/',
  // authenticateToken,
  [
    body('name').notEmpty().trim().isLength({ min: 2, max: 50 }),
    body('description').optional().trim(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  CategoryController.createCategory
);

router.put(
  '/:id',
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('description').optional().trim(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  CategoryController.updateCategory
);

router.delete('/:id', authenticateToken, CategoryController.deleteCategory);

export default router;