// controllers/authController.js
import { generateToken } from '../middleware/auth.js';

// Simple user storage - just one admin user from environment
const getAdminUser = () => ({
  id: 'admin_001',
  name: process.env.ADMIN_NAME || 'Admin',
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,  
  role: 'admin'
});

console.log(getAdminUser);
class AuthController {
  // Login user
  static async login(req, res) {
    
    try {
      const { email, password } = req.body;
      
      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      // Get admin credentials from environment
      const adminUser = getAdminUser();
      
      // Check credentials
      if (email !== adminUser.email || password !== adminUser.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Generate token
      const token = generateToken(adminUser);
      
      // Remove password from response
      const { password: _, ...userResponse } = adminUser;
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }
  
  // Get current user info
  static async getProfile(req, res) {
    try {
      // User info is available from middleware
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }
  
  
  // Logout user (simple response)
  static async logout(req, res) {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }
}

export default AuthController;