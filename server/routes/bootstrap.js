import express from 'express';
import { seedAdminUser } from '../scripts/seedAdminRunner.js';

const router = express.Router();

/**
 * TEMPORARY BOOTSTRAP ENDPOINT
 * This endpoint seeds the admin user in production
 * 
 * Security: Requires ADMIN_SEED_TOKEN from environment variables
 * 
 * Usage:
 * POST /api/bootstrap/seed-admin
 * Header: x-seed-token: <your-secret-token>
 * 
 * IMPORTANT: Remove this route after successfully seeding the database!
 */
router.post('/seed-admin', async (req, res) => {
  try {
    // Check if seed token is configured
    const expectedToken = process.env.ADMIN_SEED_TOKEN;
    
    if (!expectedToken) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_SEED_TOKEN not configured in environment variables'
      });
    }

    // Verify the token from request header
    const providedToken = req.headers['x-seed-token'];
    
    if (!providedToken || providedToken !== expectedToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing seed token'
      });
    }

    // Run the seed function
    console.log('🔐 Bootstrap endpoint called with valid token');
    const result = await seedAdminUser();

    // Return the result
    return res.status(result.success ? 200 : 500).json(result);
    
  } catch (error) {
    console.error('Bootstrap endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bootstrap endpoint is active',
    warning: 'This is a temporary endpoint and should be removed after seeding'
  });
});

export default router;
