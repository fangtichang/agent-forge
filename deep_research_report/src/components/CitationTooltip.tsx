import { Tooltip, Box, Typography, Link } from '@mui/material';
import type { Citation } from '@/types';

/** Props for CitationTooltip component. */
interface CitationTooltipProps {
  /** The citation number displayed as superscript. */
  index: number;
  /** The citation data (URL, title, snippet). */
  citation: Citation;
}

/**
 * Inline citation marker rendered as a superscript number.
 *
 * On hover, displays a tooltip with the citation title, URL, and snippet.
 */
export default function CitationTooltip({ index, citation }: CitationTooltipProps) {
  return (
    <Tooltip
      title={
        <Box sx={{ maxWidth: 320, p: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {citation.title}
          </Typography>
          <Link
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontSize: '0.75rem',
              color: 'primary.light',
              wordBreak: 'break-all',
              display: 'block',
              mb: 0.5,
            }}
          >
            {citation.url}
          </Link>
          <Typography variant="caption" sx={{ color: 'grey.300', lineHeight: 1.4 }}>
            {citation.snippet}
          </Typography>
        </Box>
      }
      arrow
      placement="top"
      enterDelay={200}
      leaveDelay={100}
    >
      <sup
        className="citation-sup"
        role="button"
        tabIndex={0}
        aria-label={`引用 ${index}: ${citation.title}`}
      >
        [{index}]
      </sup>
    </Tooltip>
  );
}
