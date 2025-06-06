// routes/blogRoutes.js
import express from 'express';
const router = express.Router();
import BlogController from '../controllers/blogController.js';
import { authenticateToken } from '../middleware/auth.js';

// Public routes
router.get('/', BlogController.getAllBlogs);
router.get('/:slug', BlogController.getBlogBySlug);
router.get('/admin/:id', BlogController.getBlogById);

// Protected routes (require authentication)
router.post('/', 
  authenticateToken,  
//   upload.single('featuredImage'), 
  BlogController.createBlog
);

router.put('/:id', 
  // authenticateToken,  
  // upload.single('featuredImage'), 
  BlogController.updateBlog
);

router.delete('/:id', 
  authenticateToken, 
  // isAdmin, 
  BlogController.deleteBlog
);

export default router;

