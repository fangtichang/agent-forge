import { useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  TextField,
  Button,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { SAMPLE_TOPICS } from '@/constants';

/** Props for TopicInput component. */
interface TopicInputProps {
  /** Callback invoked when the user submits a topic. */
  onSubmit: (topic: string) => void;
  /** Whether submission is currently in progress. */
  disabled?: boolean;
}

/**
 * Topic input component with sample topic chips.
 *
 * Supports submission via click on the send button or pressing Enter.
 * Clicking a sample chip auto-fills and submits the topic.
 */
export default function TopicInput({ onSubmit, disabled = false }: TopicInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (topic: string) => {
    if (disabled) return;
    setValue(topic);
    onSubmit(topic);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="请输入您想研究的行业话题，例如：人工智能行业深度分析..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1rem',
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          sx={{
            minWidth: 56,
            height: 56,
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          <SendIcon />
        </Button>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}
      >
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', lineHeight: '32px', mr: 0.5 }}
        >
          示例话题：
        </Typography>
        {SAMPLE_TOPICS.map((topic) => (
          <Chip
            key={topic}
            label={topic}
            variant="outlined"
            color="primary"
            clickable
            disabled={disabled}
            onClick={() => handleChipClick(topic)}
            sx={{ borderRadius: 1.5 }}
          />
        ))}
      </Stack>
    </Box>
  );
}
