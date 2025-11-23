// Health check routes - used to monitor server status
import express from 'express';
import * as healthController from '../controllers/health-controller.js';

const router = express.Router();

// Simple health check endpoint
router.get('/', healthController.healthCheck);

export default router;

