/**
 * Health check route — GET /api/v1/health
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import { checkLLMHealth } from '../services/llmClient.js';
import { checkSearchHealth } from '../services/searchService.js';
import { cacheService } from '../services/cacheService.js';
import type { ApiResponse, HealthCheckResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Check downstream services in parallel
  const [llmUp, searchUp] = await Promise.all([
    checkLLMHealth().catch(() => false),
    checkSearchHealth().catch(() => false),
  ]);

  const redisUp = cacheService.isConnected();
  const postgresUp = true; // In production, check pg connection

  const servicesDown = [llmUp, searchUp, redisUp, postgresUp].filter((s) => !s).length;
  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (servicesDown === 0) {
    status = 'healthy';
  } else if (servicesDown <= 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  const data: HealthCheckResponse = {
    status,
    uptime: process.uptime(),
    version: config.server.version,
    services: {
      postgres: postgresUp ? 'up' : 'down',
      redis: redisUp ? 'up' : 'down',
      llm: llmUp ? 'up' : 'down',
      search: searchUp ? 'up' : 'down',
    },
  };

  const body: ApiResponse<HealthCheckResponse> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId || 'unknown',
    },
  };

  const statusCode = status === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(body);
});

export default router;
