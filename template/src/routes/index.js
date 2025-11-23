// Main routes file - brings all routes together
// Add new routes here when you create them
import express from 'express';
import userRoutes from './user-route.js';
import healthRoutes from './health-route.js';

const router = express.Router();

// Health check - used to verify server is running
router.use('/health', healthRoutes);

// User management routes
router.use('/users', userRoutes);

export default router;

