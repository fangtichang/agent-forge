import { useState, type KeyboardEvent } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useFollowUp } from '@/hooks/useFollowUp';
import { REPORT_CONFIG } from '@/constants';
import type { FollowUp } from '@/types';

/** Props for FollowUpPanel component. */
interface FollowUpPanelProps {
  /** Whether the drawer is open. */
  open: boolean;
  /** Callback to close the drawer. */
  onClose: () => void;
  /** ID of the chapter the follow-up is about. */
  chapterId: string;
  /** Index of the paragraph being asked about. */
  paragraphIndex: number;
  /** The original paragraph text for context. */
  paragraphText: string;
}

/**
 * Follow-up question panel rendered as a right-side Drawer.
 *
 * Features:
 * - Original paragraph display for context
 * - Question input with send button
 * - Streaming answer display using react-markdown
 * - "继续追问" button (limited to 2 levels deep)
 * - Close button
 */
export default function FollowUpPanel({
  open,
  onClose,
  chapterId,
  paragraphIndex,
  paragraphText,
}: FollowUpPanelProps) {
  const [question, setQuestion] = useState('');
  const { followUps, followUpActive, askFollowUp } = useFollowUp();

  /** Current follow-ups for this chapter/paragraph. */
  const relevantFollowUps = followUps.filter(
    (fu) => fu.chapterId === chapterId && fu.paragraphIndex === paragraphIndex,
  );

  /** The latest follow-up (most recently created). */
  const currentFollowUp: FollowUp | undefined =
    relevantFollowUps.length > 0
      ? relevantFollowUps[relevantFollowUps.length - 1]
      : undefined;

  /** Whether follow-ups have reached the max depth. */
  const isMaxDepth =
    relevantFollowUps.filter((fu) => !fu.parentId).length >=
    REPORT_CONFIG.MAX_FOLLOW_UP_DEPTH;

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (!trimmed || followUpActive) return;

    const parentId = currentFollowUp ? currentFollowUp.id : undefined;

    askFollowUp(chapterId, paragraphIndex, trimmed, parentId);
    setQuestion('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /** Render markdown content. */
  const renderMarkdown = (content: string) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          追问
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Original paragraph */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block' }}
        >
          原文
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1,
            maxHeight: 120,
            overflowY: 'auto',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            {paragraphText.length > 300
              ? paragraphText.slice(0, 300) + '...'
              : paragraphText}
          </Typography>
        </Paper>
      </Box>

      <Divider />

      {/* Follow-up history */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {relevantFollowUps.map((fu) => (
          <Box key={fu.id} sx={{ mb: 2 }}>
            {/* Question */}
            <Box
              sx={{
                bgcolor: 'primary.50',
                p: 1.5,
                borderRadius: 2,
                borderTopRightRadius: 0,
                ml: 4,
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {fu.question}
              </Typography>
            </Box>

            {/* Answer */}
            {fu.answer && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  borderTopLeftRadius: 0,
                  bgcolor: 'grey.50',
                }}
              >
                <Box className="report-content" sx={{ fontSize: '0.9rem' }}>
                  {renderMarkdown(fu.answer)}
                </Box>

                {/* Citations */}
                {fu.citations.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600 }}
                    >
                      引用来源：
                    </Typography>
                    {fu.citations.map((c) => (
                      <Typography
                        key={c.id}
                        variant="caption"
                        component="div"
                        sx={{ color: 'primary.main', mt: 0.25 }}
                      >
                        [{c.id}] {c.title}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Generating indicator */}
            {fu.status === 'generating' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, ml: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  正在生成回答...
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Input area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {isMaxDepth ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center', py: 1 }}
          >
            已达到追问深度限制（最多{REPORT_CONFIG.MAX_FOLLOW_UP_DEPTH}层）
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={
                currentFollowUp ? '继续追问...' : '输入您的追问...'
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={followUpActive}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={followUpActive || !question.trim()}
              sx={{
                minWidth: 48,
                height: 40,
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              {followUpActive ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon fontSize="small" />
              )}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
