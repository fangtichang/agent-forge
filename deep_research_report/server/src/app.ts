/**
 * Express application configuration.
 * Centralizes all middleware and route registration.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { auth } from './middleware/auth.js';

// Routes
import healthRoute from './routes/health.js';
import decomposeRoute from './routes/decompose.js';
import searchRoute from './routes/search.js';
import generateRoute from './routes/generate.js';
import followUpRoute from './routes/followUp.js';
import reportsRoute from './routes/reports.js';
import knowledgeRoute from './routes/knowledge.js';

export function createApp(): express.Application {
  const app = express();

  // ── Global Middleware ──

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Handled by nginx
  }));

  // CORS
  app.use(cors({
    origin: config.security.corsOrigin,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Request-Id'],
    maxAge: 86400,
  }));

  // Request ID for tracing
  app.use(requestId);

  // Body parsing
  app.use(express.json({ limit: '1mb' }));

  // ── Global rate limiting ──
  app.use(rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  }));

  // ── Public routes (no auth required) ──
  app.use('/api/v1/health', healthRoute);

  // ── Stricter rate limiting for LLM-heavy endpoints (applied before route handlers) ──
  const llmLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Report generation limit reached. Please try again later.',
      },
    },
  });

  // ── Protected routes (API key required in production) ──
  app.use('/api/v1/decompose', llmLimiter, auth, decomposeRoute);
  app.use('/api/v1/search', auth, searchRoute);
  app.use('/api/v1/generate', llmLimiter, auth, generateRoute);
  app.use('/api/v1/follow-up', auth, followUpRoute);
  app.use('/api/v1/reports', auth, reportsRoute);
  app.use('/api/v1/knowledge', auth, knowledgeRoute);

  // ── Global error handler (must be last) ──
  app.use(errorHandler);

  return app;
}
