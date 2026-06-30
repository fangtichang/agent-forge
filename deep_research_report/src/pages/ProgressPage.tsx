import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SearchIcon from '@mui/icons-material/Search';
import ProgressStepper from '@/components/ProgressStepper';
import { useReportContext } from '@/context/ReportContext';
import { StorageService } from '@/services/storage';
import type { GenerationPhase } from '@/types';

/**
 * Progress page — shown during report generation.
 *
 * Displays the progress stepper, streaming chapter previews,
 * and status indicators (sources found, chapters completed).
 * Automatically navigates to the report page when generation completes.
 */
export default function ProgressPage() {
  const { state } = useReportContext();
  const navigate = useNavigate();
  const { report, phase, error } = state;

  // Auto-navigate when report is complete (save to localStorage first)
  useEffect(() => {
    if (phase === 'done' && report) {
      // Persist the completed report
      StorageService.saveReport(report);
      // Small delay to let the user see the completion state
      const timer = setTimeout(() => {
        navigate(`/report/${report.id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, report, navigate]);

  // Redirect to home if no report is being generated
  useEffect(() => {
    if (!report && phase === 'input') {
      navigate('/');
    }
  }, [report, phase, navigate]);

  if (!report) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          没有正在进行的报告生成任务
        </Typography>
      </Box>
    );
  }

  const completedChapters = report.chapters.filter(
    (ch) => ch.status === 'completed',
  ).length;
  const totalChapters = report.subTasks.length;
  const completedSubtasks = report.subTasks.filter(
    (st) => st.status === 'completed',
  ).length;

  /** Get the progress percentage based on phase. */
  const getProgress = (): number => {
    switch (phase) {
      case 'input':
        return 0;
      case 'decomposing':
        return 10;
      case 'searching':
        return 25 + (completedSubtasks / Math.max(totalChapters, 1)) * 25;
      case 'generating':
        return 50 + (completedChapters / Math.max(totalChapters, 1)) * 45;
      case 'done':
        return 100;
      default:
        return 0;
    }
  };

  /** Compute the current phase for the stepper. */
  const stepperPhase: GenerationPhase = phase;

  /** Render the current status text. */
  const getStatusText = (): string => {
    switch (phase) {
      case 'decomposing':
        return '正在拆解话题...';
      case 'searching':
        return `正在多路检索 (${completedSubtasks}/${totalChapters})...`;
      case 'generating':
        return `正在生成报告 (${completedChapters}/${totalChapters})...`;
      case 'done':
        return '报告生成完成！';
      default:
        return '准备中...';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', width: '100%' }}>
      {/* Progress stepper */}
      <ProgressStepper phase={stepperPhase} />

      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {report.topic}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {getStatusText()}
      </Typography>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={getProgress()}
        sx={{
          height: 8,
          borderRadius: 4,
          mb: 3,
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
          },
        }}
      />

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Sub-tasks status */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          子任务进度
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {report.subTasks.map((st) => (
            <Chip
              key={st.id}
              icon={
                st.status === 'completed' ? (
                  <CheckCircleIcon />
                ) : st.status === 'searching' ? (
                  <SearchIcon />
                ) : (
                  <HourglassEmptyIcon />
                )
              }
              label={st.title}
              size="small"
              color={
                st.status === 'completed'
                  ? 'success'
                  : st.status === 'searching'
                    ? 'primary'
                    : 'default'
              }
              variant={st.status === 'pending' ? 'outlined' : 'filled'}
            />
          ))}
        </Box>
      </Paper>

      {/* Streaming chapter preview */}
      {report.chapters.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            章节生成预览
          </Typography>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {report.chapters.map((ch) => (
              <Box key={ch.id} sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {ch.title}{' '}
                  {ch.status === 'completed' && (
                    <CheckCircleIcon
                      sx={{ fontSize: 16, color: 'success.main', ml: 0.5 }}
                    />
                  )}
                  {ch.status === 'generating' && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ color: 'primary.main', ml: 1 }}
                    >
                      ● 生成中
                    </Typography>
                  )}
                </Typography>
                {ch.content && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                      maxHeight: 120,
                      overflow: 'hidden',
                      position: 'relative',
                      '&::after':
                        ch.status === 'generating'
                          ? {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 40,
                              background:
                                'linear-gradient(transparent, white)',
                            }
                          : {},
                    }}
                  >
                    {ch.content.length > 300
                      ? ch.content.slice(0, 300) + '...'
                      : ch.content}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
