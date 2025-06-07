import express from 'express';
import BlogController from '../controllers/blogController.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router(); 
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Public routes
router.get('/', BlogController.getAllBlogs);
router.get('/:slug', BlogController.getBlogBySlug);
router.get('/admin/:id', BlogController.getBlogById);

// Protected routes (require authentication)
router.post('/', authenticateToken, BlogController.createBlog);
router.put('/:id', authenticateToken, BlogController.updateBlog);
router.delete('/:id', authenticateToken, BlogController.deleteBlog);
// Your route should look like this:
 

router.post('/upload-images', upload.array('images'), BlogController.uploadImages);

export default router;