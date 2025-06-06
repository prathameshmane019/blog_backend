// middleware/auth.js
import pkg from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { sign, verify } = pkg;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers
    ['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify token
    verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      // Add user info to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user'
      };
      
      next();
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Utility function to generate JWT token
export const generateToken = (userData) => {
  const payload = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role || 'user'
  };
  
  return sign(payload, JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
};