/**
 * Server entry point.
 * Initializes services, starts the HTTP server, and handles graceful shutdown.
 */
import { createApp } from './app.js';
import { config, validateConfig } from './config.js';
import { cacheService } from './services/cacheService.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  logger.info('╔══════════════════════════════════════════╗');
  logger.info('║     Agent Forge Backend Server v1.0      ║');
  logger.info('╚══════════════════════════════════════════╝');
  logger.info(`Environment: ${config.server.nodeEnv}`);
  logger.info(`Port:        ${config.server.port}`);

  // Validate required configuration
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    logger.warn('⚠️  Configuration warnings:');
    configErrors.forEach((e) => logger.warn(`   - ${e}`));
  }

  // Connect to Redis (non-blocking — system runs without it)
  await cacheService.connect();

  // Create and start Express app
  const app = createApp();

  const server = app.listen(config.server.port, config.server.host, () => {
    logger.info(`\n✅ Server listening on http://${config.server.host}:${config.server.port}`);
    logger.info(`   Health check: http://localhost:${config.server.port}/api/v1/health\n`);
  });

  // ── Graceful shutdown ──
  const shutdown = async (signal: string) => {
    logger.info(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('   HTTP server closed');

      // Disconnect Redis
      await cacheService.disconnect();

      logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});