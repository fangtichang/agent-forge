import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TableOfContents from '@/components/TableOfContents';
import CitationTooltip from '@/components/CitationTooltip';
import FollowUpPanel from '@/components/FollowUpPanel';
import ExportButton from '@/components/ExportButton';
import { useReportContext } from '@/context/ReportContext';
import { StorageService } from '@/services/storage';
import type { Citation, Chapter } from '@/types';

/**
 * Report page — displays the completed research report.
 *
 * Two-column layout:
 * - Left: Table of contents sidebar (sticky)
 * - Right: Report content with citations and follow-up support
 *
 * Features:
 * - Markdown rendering with citation tooltips
 * - Paragraph click to open follow-up panel
 * - Export to Markdown button
 * - Citation summary at the bottom
 */
export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useReportContext();
  const { report } = state;

  // Follow-up state
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpTarget, setFollowUpTarget] = useState<{
    chapterId: string;
    paragraphIndex: number;
    paragraphText: string;
  }>({ chapterId: '', paragraphIndex: 0, paragraphText: '' });

  // Load report from localStorage if not in context
  useEffect(() => {
    if (!report && id) {
      const loaded = StorageService.loadReport(id);
      if (loaded) {
        dispatch({ type: 'LOAD_REPORT', report: loaded });
      }
    }
  }, [id, report, dispatch]);

  // Derive chapter titles from sub-tasks
  const chaptersWithTitles: Chapter[] = useMemo(() => {
    if (!report) return [];
    const subTaskMap = new Map(report.subTasks.map((st) => [st.id, st.title]));
    return report.chapters.map((ch) => {
      const stId = `st_${ch.id.split('_')[1]}`;
      return {
        ...ch,
        title: subTaskMap.get(stId) || ch.title,
      };
    });
  }, [report]);

  /** Collect all unique citations across all chapters. */
  const allCitations: Citation[] = useMemo(() => {
    const map = new Map<number, Citation>();
    if (!report) return [];
    for (const ch of report.chapters) {
      for (const c of ch.citations) {
        if (!map.has(c.id)) {
          map.set(c.id, c);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [report]);

  /**
   * Handle paragraph click to open follow-up panel.
   */
  const handleParagraphClick = (
    chapterId: string,
    paragraphIndex: number,
    paragraphText: string,
  ) => {
    setFollowUpTarget({ chapterId, paragraphIndex, paragraphText });
    setFollowUpOpen(true);
  };

  if (!report) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          加载报告中...
        </Typography>
      </Box>
    );
  }

  if (report.status === 'error') {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          报告加载失败
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          返回首页
        </Button>
      </Box>
    );
  }

  /**
   * Custom renderer for the markdown content.
   * Handles citation markers and paragraph click events.
   */
  const renderMarkdownContent = (content: string, chapter: Chapter) => {
    // Split content into lines and wrap paragraphs with click handlers
    const paragraphs = content.split('\n\n');
    const citationRegex = /\[citation:(\d+)\]/g;

    return (
      <Box>
        {paragraphs.map((para, pIdx) => {
          // Skip empty paragraphs
          if (!para.trim()) return null;

          // Replace [citation:N] markers with citation references
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let match: RegExpExecArray | null;

          const regex = new RegExp(citationRegex);
          let localLastIdx = 0;

          while ((match = regex.exec(para)) !== null) {
            // Add text before the citation
            if (match.index > localLastIdx) {
              parts.push(
                <span key={`txt-${localLastIdx}`}>
                  {para.slice(localLastIdx, match.index)}
                </span>,
              );
            }

            const citationId = parseInt(match[1], 10);
            const citation = chapter.citations.find((c) => c.id === citationId);

            if (citation) {
              parts.push(
                <CitationTooltip
                  key={`cit-${match.index}`}
                  index={citationId}
                  citation={citation}
                />,
              );
            } else {
              parts.push(
                <sup key={`cit-unk-${match.index}`} className="citation-sup">
                  [{citationId}]
                </sup>,
              );
            }

            localLastIdx = match.index + match[0].length;
          }

          // Add remaining text after last citation
          if (localLastIdx < para.length) {
            parts.push(
              <span key={`txt-end-${localLastIdx}`}>
                {para.slice(localLastIdx)}
              </span>,
            );
          }

          const hasCitations = citationRegex.test(para);
          citationRegex.lastIndex = 0; // reset

          // Determine if this is a heading or regular paragraph
          const isHeading = para.trim().startsWith('##');

          if (isHeading) {
            return (
              <Box
                key={`h-${pIdx}`}
                id={pIdx === 0 ? `chapter-${chapter.id}` : undefined}
                sx={{ mt: pIdx > 0 ? 3 : 0, mb: 2 }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {para}
                </ReactMarkdown>
              </Box>
            );
          }

          return (
            <Box
              key={`p-${pIdx}`}
              id={pIdx === 0 ? `chapter-${chapter.id}` : undefined}
              className="report-paragraph"
              onClick={() =>
                handleParagraphClick(
                  chapter.id,
                  pIdx,
                  para.replace(citationRegex, '[$1]'),
                )
              }
              sx={{ mb: 1.5, p: 0.5, borderRadius: 1, mx: -0.5 }}
            >
              {hasCitations || parts.length === 0 ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {para.replace(citationRegex, '[$1]')}
                </ReactMarkdown>
              ) : (
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {parts}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, flex: 1 }}>
      {/* TOC sidebar */}
      {chaptersWithTitles.length > 0 && (
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableOfContents chapters={chaptersWithTitles} />
        </Box>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              size="small"
              onClick={() => navigate('/')}
              sx={{ mb: 1 }}
            >
              返回
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {report.topic}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              生成于 {new Date(report.createdAt).toLocaleString('zh-CN')}
            </Typography>
          </Box>
          <ExportButton report={report} />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Report content */}
        <Paper
          variant="outlined"
          sx={{ p: { xs: 2, md: 4 }, mb: 4 }}
          className="report-content"
        >
          {chaptersWithTitles.map((chapter) => (
            <Box key={chapter.id} sx={{ mb: 4 }}>
              {renderMarkdownContent(chapter.content, chapter)}
              {chapter.status === 'generating' && (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
                >
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    生成中...
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Paper>

        {/* Citation summary */}
        {allCitations.length > 0 && (
          <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              引用来源
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              {allCitations.map((c) => (
                <Box
                  component="li"
                  key={c.id}
                  sx={{ mb: 1.5, fontSize: '0.9rem' }}
                >
                  <Typography
                    component="a"
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      fontWeight: 600,
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {c.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', mt: 0.25 }}
                  >
                    {c.snippet}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.disabled',
                      wordBreak: 'break-all',
                      display: 'block',
                      mt: 0.25,
                    }}
                  >
                    {c.url}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>

      {/* Follow-up panel */}
      <FollowUpPanel
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        chapterId={followUpTarget.chapterId}
        paragraphIndex={followUpTarget.paragraphIndex}
        paragraphText={followUpTarget.paragraphText}
      />
    </Box>
  );
}
