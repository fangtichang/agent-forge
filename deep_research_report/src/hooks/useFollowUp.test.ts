import { describe, it, expect, vi, beforeEach } from 'vitest';
import { REPORT_CONFIG } from '@/constants';
import type { ReportState, FollowUp } from '@/types';

/**
 * Follow-up depth limit logic tests.
 *
 * Tests the depth validation logic used in useFollowUp.ts and FollowUpPanel.tsx.
 * Since the hook uses React context and async streaming, we test the core
 * decision logic in isolation to cover the depth limit scenarios.
 */

/** Maximum follow-up depth constant. */
const MAX_DEPTH = REPORT_CONFIG.MAX_FOLLOW_UP_DEPTH; // 2

/** Test data factory. */
function createFollowUp(
  id: string,
  parentId?: string,
  chapterId = 'ch_1',
  paragraphIndex = 0,
): FollowUp {
  return {
    id,
    chapterId,
    paragraphIndex,
    question: `问题 ${id}`,
    answer: `回答 ${id}`,
    citations: [],
    status: 'completed',
    parentId,
  };
}

/**
 * Check if adding a new follow-up at the current depth is allowed.
 * Mirrors the logic in FollowUpPanel.tsx and useFollowUp.ts:
 *
 * 1. A follow-up with parentId is rejected (depth > 2)
 * 2. More than 2 root follow-ups (no parentId) for same chapter/paragraph are rejected
 */
function canAddFollowUp(
  existingFollowUps: FollowUp[],
  chapterId: string,
  paragraphIndex: number,
  parentId?: string,
): { allowed: boolean; reason?: string } {
  // Rule 1: parentId means depth > 2 — always reject
  if (parentId) {
    return {
      allowed: false,
      reason: `Follow-up depth limited to ${MAX_DEPTH} layers`,
    };
  }

  // Rule 2: Check existing root-level follow-ups for this chapter/paragraph
  const existingRootCount = existingFollowUps.filter(
    (fu) =>
      fu.chapterId === chapterId &&
      fu.paragraphIndex === paragraphIndex &&
      !fu.parentId,
  ).length;

  if (existingRootCount >= MAX_DEPTH) {
    return {
      allowed: false,
      reason: `已达到追问深度限制（最多${MAX_DEPTH}层）`,
    };
  }

  return { allowed: true };
}

describe('FollowUp Depth Limit Logic', () => {
  describe('1 layer follow-up (root level)', () => {
    it('should allow first follow-up on a paragraph', () => {
      const result = canAddFollowUp([], 'ch_1', 0);
      expect(result.allowed).toBe(true);
    });

    it('should allow follow-up on different paragraphs', () => {
      const existing = [createFollowUp('fu_1', undefined, 'ch_1', 0)];

      // Different paragraph index in same chapter
      const result = canAddFollowUp(existing, 'ch_1', 1);
      expect(result.allowed).toBe(true);
    });

    it('should allow follow-up on different chapter', () => {
      const existing = [createFollowUp('fu_1', undefined, 'ch_1', 0)];

      // Different chapter
      const result = canAddFollowUp(existing, 'ch_2', 0);
      expect(result.allowed).toBe(true);
    });
  });

  describe('2 layer follow-up', () => {
    it('should allow second root follow-up on same paragraph', () => {
      const existing = [createFollowUp('fu_1', undefined, 'ch_1', 0)];

      const result = canAddFollowUp(existing, 'ch_1', 0);
      expect(result.allowed).toBe(true);
    });

    it('should allow exactly 2 root follow-ups', () => {
      // First
      const result1 = canAddFollowUp([], 'ch_1', 0);
      expect(result1.allowed).toBe(true);

      // Second
      const afterFirst = [createFollowUp('fu_1', undefined, 'ch_1', 0)];
      const result2 = canAddFollowUp(afterFirst, 'ch_1', 0);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('3 layer follow-up rejection', () => {
    it('should reject follow-up with parentId (depth 3)', () => {
      const existing = [
        createFollowUp('fu_1', undefined, 'ch_1', 0),
        createFollowUp('fu_2', 'fu_1', 'ch_1', 0), // child of fu_1
      ];

      // Try to add child of fu_2 (would be depth 3)
      const result = canAddFollowUp(existing, 'ch_1', 0, 'fu_2');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('depth limited');
    });

    it('should reject third root follow-up on same paragraph', () => {
      const existing = [
        createFollowUp('fu_1', undefined, 'ch_1', 0),
        createFollowUp('fu_2', undefined, 'ch_1', 0),
      ];

      // Third root follow-up
      const result = canAddFollowUp(existing, 'ch_1', 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('已达到追问深度限制');
    });

    it('should provide reasonable error message when rejecting', () => {
      const result1 = canAddFollowUp([], 'ch_1', 0, 'some_parent');
      expect(result1.allowed).toBe(false);
      expect(result1.reason).toBeDefined();
      expect(result1.reason!.length).toBeGreaterThan(0);

      const existing = [
        createFollowUp('fu_1', undefined, 'ch_1', 0),
        createFollowUp('fu_2', undefined, 'ch_1', 0),
      ];
      const result2 = canAddFollowUp(existing, 'ch_1', 0);
      expect(result2.allowed).toBe(false);
      expect(result2.reason).toBeDefined();
      expect(result2.reason!.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should allow follow-ups across different paragraphs independently', () => {
      const existing = [
        createFollowUp('fu_1', undefined, 'ch_1', 0),
        createFollowUp('fu_2', undefined, 'ch_1', 0),
      ];

      // Different paragraph — should still be allowed
      const result = canAddFollowUp(existing, 'ch_1', 1);
      expect(result.allowed).toBe(true);
    });

    it('should count only root-level follow-ups for depth check', () => {
      // 2 root follow-ups + 1 child follow-up on para 0
      const existing = [
        createFollowUp('fu_1', undefined, 'ch_1', 0),
        createFollowUp('fu_2', 'fu_1', 'ch_1', 0), // child — not counted as root
        createFollowUp('fu_3', undefined, 'ch_1', 0),
      ];

      // Should be rejected because 2 root follow-ups already exist
      const result = canAddFollowUp(existing, 'ch_1', 0);
      expect(result.allowed).toBe(false);
    });

    it('should handle empty parentId (undefined) as root level', () => {
      const result = canAddFollowUp([], 'ch_1', 0, undefined);
      expect(result.allowed).toBe(true);
    });

    it('should respect MAX_FOLLOW_UP_DEPTH constant', () => {
      expect(MAX_DEPTH).toBe(2);
    });
  });
});
