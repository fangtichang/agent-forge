/**
 * Knowledge base CRUD route — /api/v1/knowledge
 *
 * POST   /              → Upload a new knowledge document
 * GET    /              → List knowledge documents (non-deleted)
 * DELETE /:id           → Soft-delete a document
 *
 * MVP: embedding generation is deferred to phase 2.
 */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { validate } from '../middleware/validator.js';
import { query } from '../db/connection.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { ApiResponse } from '../types/index.js';
import type { KnowledgeDocumentRow } from '../db/types.js';

const router = Router();

// ── Schemas ──

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required'),
  sourceUrl: z.string().url().optional().or(z.literal('')),
});

const knowledgeIdParamSchema = z.object({
  id: z.string().uuid('Invalid document ID format'),
});

// ── Helpers ──

/** Compute SHA-256 hash of content for deduplication. */
function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** Count words in a text (splits on whitespace). */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Map DB row to API shape. */
function toApiDocument(row: KnowledgeDocumentRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    contentHash: row.content_hash,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    wordCount: row.word_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── POST /api/v1/knowledge ──

router.post(
  '/',
  validate(createDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, sourceUrl } = req.body as {
        title: string;
        content: string;
        sourceUrl?: string;
      };

      const contentHash = computeContentHash(content);
      const wordCount = countWords(content);

      const rows = await query<KnowledgeDocumentRow>(
        `INSERT INTO knowledge_documents
           (title, content, content_hash, source_url, word_count)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [title, content, contentHash, sourceUrl || null, wordCount],
      );

      const doc = rows[0];
      if (!doc) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          'Failed to create knowledge document',
          500,
        );
      }

      const body: ApiResponse<ReturnType<typeof toApiDocument>> = {
        success: true,
        data: toApiDocument(doc),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      };

      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/v1/knowledge ──

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await query<KnowledgeDocumentRow>(
        'SELECT * FROM knowledge_documents WHERE deleted_at IS NULL ORDER BY created_at DESC',
      );

      const body: ApiResponse<ReturnType<typeof toApiDocument>[]> = {
        success: true,
        data: rows.map(toApiDocument),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      };

      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /api/v1/knowledge/:id ──

router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = knowledgeIdParamSchema.parse(req.params);

      const existing = await query<KnowledgeDocumentRow>(
        'SELECT id FROM knowledge_documents WHERE id = $1 AND deleted_at IS NULL',
        [id],
      );

      if (existing.length === 0) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Knowledge document "${id}" not found`,
          404,
        );
      }

      // Soft delete
      await query(
        'UPDATE knowledge_documents SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
        [id],
      );

      const body: ApiResponse<{ deleted: string }> = {
        success: true,
        data: { deleted: id },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      };

      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
