/**
 * Reports CRUD route — /api/v1/reports
 *
 * GET    /              → List all reports (paginated)
 * GET    /:id           → Get a single report with full detail
 * DELETE /:id           → Delete a report and all cascaded data
 */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import {
  listReports,
  getReport,
  deleteReport,
  getChaptersByReport,
  getCitationsByChapter,
  getFollowUpsByChapter,
} from '../db/repositories/reportRepo.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { ApiResponse } from '../types/index.js';
import type {
  ReportRow,
  ChapterRow,
  CitationRow,
  FollowUpRow,
} from '../db/types.js';

const router = Router();

// ── Types ──

/** Enriched chapter returned in report detail. */
interface ChapterDetail {
  id: string;
  reportId: string;
  subTaskId: string | null;
  sortOrder: number;
  title: string;
  content: string;
  wordCount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  citations: CitationRow[];
  followUps: FollowUpRow[];
}

/** Full report detail returned by GET /:id. */
interface ReportDetail {
  id: string;
  topic: string;
  status: string;
  totalChapters: number;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
  chapters: ChapterDetail[];
}

/** Summary row returned by list. */
interface ReportSummary {
  id: string;
  topic: string;
  status: string;
  createdAt: string;
}

// ── Route params schema ──

const reportIdParamSchema = z.object({
  id: z.string().uuid('Invalid report ID format'),
});

const listQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = parseInt(v || '50', 10);
      return Number.isNaN(n) ? 50 : Math.min(n, 100);
    }),
  offset: z
    .string()
    .optional()
    .transform((v) => {
      const n = parseInt(v || '0', 10);
      return Number.isNaN(n) ? 0 : Math.max(n, 0);
    }),
});

// ── GET /api/v1/reports ──

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, offset } = listQuerySchema.parse(req.query);
      const rows = await listReports(limit, offset);

      const summaries: ReportSummary[] = rows.map((r: ReportRow) => ({
        id: r.id,
        topic: r.topic,
        status: r.status,
        createdAt: r.created_at,
      }));

      const body: ApiResponse<ReportSummary[]> = {
        success: true,
        data: summaries,
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

// ── GET /api/v1/reports/:id ──

router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = reportIdParamSchema.parse(req.params);
      const report = await getReport(id);

      if (!report) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Report "${id}" not found`,
          404,
        );
      }

      // Fetch chapters
      const chapters = await getChaptersByReport(id);

      // Hydrate each chapter with citations and follow-ups
      const chapterDetails: ChapterDetail[] = [];
      for (const ch of chapters) {
        const [citations, followUps] = await Promise.all([
          getCitationsByChapter(ch.id),
          getFollowUpsByChapter(ch.id),
        ]);

        chapterDetails.push({
          id: ch.id,
          reportId: ch.report_id,
          subTaskId: ch.sub_task_id,
          sortOrder: ch.sort_order,
          title: ch.title,
          content: ch.content,
          wordCount: ch.word_count,
          status: ch.status,
          createdAt: ch.created_at,
          completedAt: ch.completed_at,
          citations,
          followUps,
        });
      }

      const detail: ReportDetail = {
        id: report.id,
        topic: report.topic,
        status: report.status,
        totalChapters: report.total_chapters,
        createdAt: report.created_at,
        completedAt: report.completed_at,
        updatedAt: report.updated_at,
        chapters: chapterDetails,
      };

      const body: ApiResponse<ReportDetail> = {
        success: true,
        data: detail,
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

// ── DELETE /api/v1/reports/:id ──

router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = reportIdParamSchema.parse(req.params);
      const report = await getReport(id);

      if (!report) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Report "${id}" not found`,
          404,
        );
      }

      await deleteReport(id);

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
