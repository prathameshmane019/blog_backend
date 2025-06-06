import express from 'express';
import TagController from '../controllers/tagController.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Public route
router.get('/', TagController.getAllTags);

// Protected routes
router.post(
  '/',
  // authenticateToken,
  [
    body('name').notEmpty().trim().isLength({ min: 2, max: 50 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  TagController.createTag
);

router.put(
  '/:id',
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  TagController.updateTag
);

router.delete('/:id', authenticateToken, TagController.deleteTag);

export default router;