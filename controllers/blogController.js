import Blog from '../models/Blogs.js';
import { slugify } from '../utils/slugify.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// Get all blogs with pagination and filters
const getAllBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    console.log('bLOG QUERY', req.query);
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

// Get blog by ID
const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(req.params.id);

    const blog = await Blog.findById(id)
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
    const { title, content, category, tags, images, isFeatured, excerpt, status } = req.body;
    console.log('Create Blog Request Body:', { title, content, images }); // Debug log
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    // Validate images array
    const validatedImages = Array.isArray(images)
      ? images.filter((img) => img && img.url && img.publicId)
      : [];
    console.log('Validated Images:', validatedImages); // Debug log
    if (images && images.length > 0 && validatedImages.length !== images.length) {
      return res.status(400).json({
        success: false,
        error: 'All images must have a valid URL and publicId',
      });
    }

    const slug = slugify(title);
    const blog = new Blog({
      title,
      slug,
      content,
      category,
      tags: tags || [],
      images: validatedImages,
      author: req.user.id, // Assuming req.user is set by authenticateToken
      isFeatured: isFeatured || false,
      excerpt,
      status: status || 'draft',
    });

    await blog.save();
    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Create Blog Error:', error); // Debug log
    next(error);
  }
};

// Update a blog
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, images, isFeatured, excerpt, status, } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    // Validate images array
    const validatedImages = Array.isArray(images)
      ? images.filter((img) => img && img.url && img.publicId)
      : [];
    console.log('Validated Images:', validatedImages); // Debug log
    if (images && images.length > 0 && validatedImages.length !== images.length) {
      return res.status(400).json({
        success: false,
        error: 'All images must have a valid URL and publicId',
      });
    }

    const updates = {
      title,
      content,
      category,
      tags: tags || [],
      images: validatedImages,
      isFeatured: isFeatured || false,
      excerpt,
      status: status || 'draft',
      updatedAt: Date.now(),
    };
    if (title) updates.slug = slugify(title);

    const blog = await Blog.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
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
    console.error('Update Blog Error:', error); // Debug log
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
    // Delete associated images from Cloudinary
    if (blog.images && blog.images.length > 0) {
      await Promise.all(
        blog.images.map((image) => deleteFromCloudinary(image.publicId))
      );
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
      .populate('tags', 'name slug')
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
      .populate('tags', 'name slug')
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

// Fixed backend uploadImages function
const uploadImages = async (req, res, next) => {
  try {
    console.log('Upload Images Request Files:', req.files); // Debug log
    console.log('Upload Images Request Body:', req.body); // Debug log

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }
    // Handle altText and captions - they come as JSON strings
    let altTexts = [];
    let captions = [];

    if (req.body.altTexts) {
      try {
        altTexts = JSON.parse(req.body.altTexts);
      } catch (e) {
        console.error('Error parsing altTexts:', e);
        altTexts = [];
      }
    }

    if (req.body.captions) {
      try {
        captions = JSON.parse(req.body.captions);
      } catch (e) {
        console.error('Error parsing captions:', e);
        captions = [];
      }
    }

    console.log('Processed altTexts:', altTexts); // Debug log
    console.log('Processed captions:', captions); // Debug log

    const uploadPromises = files.map((file, index) =>
      uploadToCloudinary(file.buffer, {
        public_id: `blog_${Date.now()}_${index}`,
        tags: ['blog_image'],
      })
    );

    const results = await Promise.all(uploadPromises);
    console.log('Cloudinary Upload Results:', results); // Debug log

    const responseData = results.map((result, index) => ({
      url: result.url,
      publicId: result.publicId,
      position: index,
      altText: altTexts[index] || '',
      caption: captions[index] || '',
    }));

    console.log('Final Response Data:', responseData); // Debug log

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Upload Images Error:', error); // Debug log
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload images',
    });
  }
};


export default {
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getTrendingBlogs,
  uploadImages,
};