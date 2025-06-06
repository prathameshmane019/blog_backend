// index.js - Express Server Entry Point
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit'; 
import dotenv from 'dotenv';
import connectDB from "./config/database.js"
// Import routes
import blogRoutes from './routes/blogs.js';
import authRoutes from './routes/auth.js'
import cors from 'cors';
import categoryRoutes from './routes/categories.js';
import tagRoutes from './routes/tags.js';

// Import middleware
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

// Create Express app
const app = express();

// Store server instance for graceful shutdown
let server;

// ===== MIDDLEWARE SETUP =====

// Security middleware - Updated CSP for better compatibility
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://pagead2.googlesyndication.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com"]
    }
  },
  crossOriginEmbedderPolicy: false // Disable for better Vercel compatibility
}));

// CORS configuration - Fixed for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL, 
          'https://blog-app-red-three.vercel.app',
          'https://blog-backend-five-mu.vercel.app' // Add your backend URL too
        ]
      : [
          'http://localhost:3000', 
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001'
        ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow in production for now, log for debugging
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'X-CSRF-Token',
    'X-Api-Version'
  ]
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // Increased limit
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased from 10 to 20
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===== API ROUTES =====

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    cors: 'enabled'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Blog API Server',
    status: 'running',
    endpoints: {
      health: '/api/health',
      blogs: '/api/blogs',
      auth: '/api/auth',
      categories: '/api/categories',
      tags: '/api/tags'
    }
  });
});

// API routes
app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authLimiter, authRoutes); 
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);

// Google AdSense ads.txt (for production)
app.get('/ads.txt', (req, res) => {
  if (process.env.ADSENSE_PUBLISHER_ID) {
    res.type('text/plain');
    res.send(`google.com, ${process.env.ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`);
  } else {
    res.status(404).send('AdSense not configured');
  }
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/auth/
Disallow: /admin/

Sitemap: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/sitemap.xml`);
});

// ===== ERROR HANDLING =====

// 404 handler - Must come after all routes
app.use(notFound);

// Global error handler - Must be last
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    // If no server instance, just close mongoose
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  }
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// ===== SERVER STARTUP =====
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start server
    server = app.listen(PORT, () => {
      console.log(`
🚀 Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 API Base: http://localhost:${PORT}/api
🔍 Health Check: http://localhost:${PORT}/api/health
🔗 CORS: ${process.env.NODE_ENV === 'production' ? 'Production origins' : 'Development origins'}
      `);
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
      }
    });
    
    // Export server for testing
    global.server = server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
export default app;