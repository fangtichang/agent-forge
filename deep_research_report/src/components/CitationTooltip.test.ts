import { describe, it, expect } from 'vitest';
import type { Citation } from '@/types';

/**
 * Citation parsing utilities tested in isolation.
 *
 * The `[citation:N]` pattern is used in markdown content rendered by
 * react-markdown. We test the regex pattern and citation mapping logic
 * used in ReportPage to parse and link citations.
 */

/** Regex pattern matching [citation:N] in markdown text. */
const CITATION_REGEX = /\[citation:(\d+)\]/g;

/** Parse citation references from text and map to Citation objects. */
function parseCitations(
  text: string,
  citations: Citation[],
): Array<{ match: string; index: number; citation: Citation | null }> {
  const results: Array<{ match: string; index: number; citation: Citation | null }> = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  CITATION_REGEX.lastIndex = 0;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const citation = citations.find((c) => c.id === num) || null;
    results.push({
      match: match[0],
      index: num,
      citation,
    });
  }

  return results;
}

describe('Citation Parsing', () => {
  const sampleCitations: Citation[] = [
    { id: 1, url: 'https://example.com/1', title: '来源1', snippet: '摘要1' },
    { id: 2, url: 'https://example.com/2', title: '来源2', snippet: '摘要2' },
    { id: 5, url: 'https://example.com/5', title: '来源5', snippet: '摘要5' },
  ];

  describe('regex matching [citation:N]', () => {
    it('should match single citation', () => {
      const text = '这是一段文字[citation:1]后面的内容';
      const matches = text.match(CITATION_REGEX);
      expect(matches).toEqual(['[citation:1]']);
    });

    it('should match multiple citations', () => {
      const text = '开头[citation:1]中间[citation:2]结尾';
      const matches = text.match(CITATION_REGEX);
      expect(matches).toEqual(['[citation:1]', '[citation:2]']);
    });

    it('should match citations with multi-digit numbers', () => {
      const text = '引用[citation:100]和[citation:101]';
      const matches = text.match(CITATION_REGEX);
      expect(matches).toEqual(['[citation:100]', '[citation:101]']);
    });

    it('should extract the citation number correctly', () => {
      const text = '文本[citation:42]更多';
      const result = parseCitations(text, sampleCitations);
      expect(result[0].index).toBe(42);
      expect(result[0].match).toBe('[citation:42]');
    });

    it('should not match malformed citation syntax', () => {
      const text = '[citation:abc] [citation:] [引用:1] [citation: 1]';
      const matches = text.match(CITATION_REGEX);
      expect(matches).toBeNull();
    });

    it('should not match similar but different patterns', () => {
      const text = '[ref:1] [cite:1] citation:1 [citation:1.5]';
      const matches = text.match(CITATION_REGEX);
      expect(matches).toBeNull();
    });
  });

  describe('citation number to Citation mapping', () => {
    it('should map citation number to correct Citation object', () => {
      const text = '文本[citation:1]';
      const result = parseCitations(text, sampleCitations);
      expect(result[0].citation).not.toBeNull();
      expect(result[0].citation!.id).toBe(1);
      expect(result[0].citation!.title).toBe('来源1');
    });

    it('should return null for unmatched citation number', () => {
      const text = '文本[citation:999]';
      const result = parseCitations(text, sampleCitations);
      expect(result[0].citation).toBeNull();
    });

    it('should map multiple citations correctly', () => {
      const text = 'A[citation:1]B[citation:5]C';
      const result = parseCitations(text, sampleCitations);
      expect(result).toHaveLength(2);
      expect(result[0].citation!.title).toBe('来源1');
      expect(result[1].citation!.title).toBe('来源5');
    });

    it('should handle mixed matched and unmatched citations', () => {
      const text = '[citation:1][citation:999][citation:2]';
      const result = parseCitations(text, sampleCitations);
      expect(result).toHaveLength(3);
      expect(result[0].citation).not.toBeNull();
      expect(result[1].citation).toBeNull();
      expect(result[2].citation).not.toBeNull();
    });
  });

  describe('no-match safety', () => {
    it('should return empty array for text without citations', () => {
      const text = '这是一段普通的文本，没有任何引用标记。';
      const result = parseCitations(text, sampleCitations);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty text', () => {
      const result = parseCitations('', sampleCitations);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty citations array', () => {
      const text = '有标记[citation:1]但没有引用数据';
      const result = parseCitations(text, []);
      expect(result).toHaveLength(1);
      expect(result[0].citation).toBeNull();
    });

    it('should not throw on null-ish inputs', () => {
      // The function should handle edge cases gracefully
      // (Note: if called with actual null, TypeScript would catch it)
      const result1 = parseCitations('', []);
      expect(result1).toEqual([]);

      const result2 = parseCitations('no citations here', []);
      expect(result2).toEqual([]);
    });

    it('should handle consecutive citation marks', () => {
      const text = '[citation:1][citation:2][citation:1]';
      const result = parseCitations(text, sampleCitations);
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.index)).toEqual([1, 2, 1]);
    });

    it('should handle citation at the very beginning of text', () => {
      const text = '[citation:1]这是开头';
      const result = parseCitations(text, sampleCitations);
      expect(result).toHaveLength(1);
      expect(result[0].citation!.id).toBe(1);
    });

    it('should handle citation at the very end of text', () => {
      const text = '这是结尾[citation:2]';
      const result = parseCitations(text, sampleCitations);
      expect(result).toHaveLength(1);
      expect(result[0].citation!.id).toBe(2);
    });

    it('should handle real-world report content with citations', () => {
      const text =
        '全球AI市场预计2028年将达到6320亿美元，年复合增长率29.1%。[citation:1][citation:2]' +
        '生成式AI的爆发式发展是这一增长的主要驱动力。[citation:3][citation:4]';

      const result = parseCitations(text, sampleCitations);

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.index)).toEqual([1, 2, 3, 4]);
      // citation 3 and 4 don't exist in sampleCitations
      expect(result[0].citation).not.toBeNull();
      expect(result[1].citation).not.toBeNull();
      expect(result[2].citation).toBeNull();
      expect(result[3].citation).toBeNull();
    });
  });

  describe('regex global state safety', () => {
    it('should reset regex state between calls', () => {
      // First call
      let result = parseCitations('[citation:1]', sampleCitations);
      expect(result).toHaveLength(1);

      // Second call should work correctly (no stale lastIndex)
      result = parseCitations('[citation:2]', sampleCitations);
      expect(result).toHaveLength(1);
      expect(result[0].index).toBe(2);
    });
  });
});
