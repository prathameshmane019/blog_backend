import Blog from '../models/Blogs.js';
import { slugify } from '../utils/slugify.js';

// Get all blogs with pagination and filters
const getAllBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    console.log('bLOG QUERY',req.query);
    const query = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const blogs = await Blog.find(query)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort(sort);

      console.log(blogs);
      

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: blogs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


// Get blog by id
const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(req.params.id);
    
    const blog = await Blog.findById( id )
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username');
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    blog.viewsCount = (blog.viewsCount || 0) + 1;
    await blog.save();
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Get blog by slug
const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    console.log(req.params);
    
    const blog = await Blog.findOne({ slug })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username');
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    blog.viewsCount = (blog.viewsCount || 0) + 1;
    await blog.save();
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new blog
const createBlog = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;
    const slug = slugify(title);
    const blog = new Blog({
      title,
      slug,
      content,
      category,
      tags,
      author: req.user.id, // Assuming req.user is set by authenticateToken
    });
    await blog.save();
    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Update a blog
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;
    const updates = { title, content, category, tags };
    if (title) updates.slug = slugify(title);
    const blog = await Blog.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('author', 'username');
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a blog
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
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

// Get featured blogs
const getFeaturedBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ isFeatured: true })
      .populate('category', 'name slug')
      .populate('author', 'username')
      .limit(5);
    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// Get trending blogs
const getTrendingBlogs = async (req, res, next) => {
  try {
    const { limit = 5, period = '7d' } = req.query;
    const date = new Date();
    if (period === '7d') date.setDate(date.getDate() - 7);
    else if (period === '30d') date.setDate(date.getDate() - 30);

    const blogs = await Blog.find({ createdAt: { $gte: date } })
      .sort({ viewsCount: -1, likesCount: -1 })
      .populate('category', 'name slug')
      .populate('author', 'username')
      .limit(Number(limit));
    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getTrendingBlogs,
  getBlogById
};