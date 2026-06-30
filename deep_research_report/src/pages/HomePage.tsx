import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TopicInput from '@/components/TopicInput';
import { useReport } from '@/hooks/useReport';

/**
 * Home page — the landing screen of the application.
 *
 * Displays the main title, subtitle, and topic input for starting
 * a new industry research report.
 */
export default function HomePage() {
  const { startReport, state } = useReport();
  const navigate = useNavigate();
  const isGenerating = state.phase !== 'input' && state.phase !== 'done';

  const handleSubmit = (topic: string) => {
    if (isGenerating) return;
    startReport(topic);
    // Navigate to progress page immediately for live generation feedback
    navigate('/progress');
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
      }}
    >
      {/* Hero section */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <AutoAwesomeIcon
          sx={{
            fontSize: 64,
            color: 'primary.main',
            mb: 2,
          }}
        />
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            mb: 1.5,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #1565c0 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          行业深度研究报告 Agent
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            fontWeight: 400,
            maxWidth: 480,
            mx: 'auto',
          }}
        >
          AI 驱动的结构化行业分析，3-5 分钟出报告
        </Typography>
      </Box>

      {/* Topic input */}
      <TopicInput onSubmit={handleSubmit} disabled={isGenerating} />

      {/* Feature highlights */}
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          mt: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          {
            title: '多维度分析',
            desc: '市场、竞争、技术、融资、趋势',
          },
          {
            title: '权威引用',
            desc: 'IDC、Gartner、McKinsey 等来源',
          },
          {
            title: '交互追问',
            desc: '点击任意段落深度追问',
          },
        ].map((feature) => (
          <Box
            key={feature.title}
            sx={{
              textAlign: 'center',
              maxWidth: 180,
              p: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {feature.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {feature.desc}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
