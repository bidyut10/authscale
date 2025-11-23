// Server entry point - this is where everything starts
// Connects to the database and starts the HTTP server
import app from './app.js';
import { connectDB, disconnectDB } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

// Start the server and connect to database
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════╗
║   ✅ Server Running Successfully      
║   Port: ${PORT.toString().padEnd(29)}
║   Environment: ${(env.NODE_ENV || 'development').padEnd(22)}
║   Time: ${new Date().toLocaleString().padEnd(28)}
╚════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      logger.info(`\n🛑 ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('✅ HTTP server closed');

        // Close database connection
        await disconnectDB();

        logger.info('✅ Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...');
      logger.error(err.name, err.message);
      logger.error(err.stack);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

