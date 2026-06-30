import { useEffect, useRef, useState } from 'react';
import { Box, List, ListItemButton, Typography } from '@mui/material';
import type { Chapter } from '@/types';

/** Props for TableOfContents component. */
interface TableOfContentsProps {
  /** The chapters to display in the TOC. */
  chapters: Chapter[];
  /** Width of the sidebar in pixels. */
  width?: number;
}

/**
 * Table of contents sidebar.
 *
 * Displays chapter titles and highlights the currently visible chapter
 * using IntersectionObserver for scroll-spy behavior.
 */
export default function TableOfContents({
  chapters,
  width = 240,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const headings: IntersectionObserverEntry[] = [];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = headings.findIndex(
            (h) => h.target.id === entry.target.id,
          );
          if (idx !== -1) {
            headings[idx] = entry;
          } else {
            headings.push(entry);
          }
        }

        // Find the first visible heading
        const visible = headings.filter((h) => h.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      },
    );

    // Observe all chapter headings in the DOM
    chapters.forEach((ch) => {
      const el = document.getElementById(`chapter-${ch.id}`);
      if (el) {
        observerRef.current?.observe(el);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [chapters]);

  /**
   * Scroll to a chapter when clicked.
   */
  const handleClick = (chapterId: string) => {
    const el = document.getElementById(`chapter-${chapterId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(chapterId);
    }
  };

  if (chapters.length === 0) return null;

  return (
    <Box
      sx={{
        width,
        flexShrink: 0,
        position: 'sticky',
        top: 80,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        borderRight: '1px solid',
        borderColor: 'divider',
        pr: 2,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontWeight: 700,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        }}
      >
        目录
      </Typography>
      <List dense disablePadding>
        {chapters.map((ch, index) => (
          <ListItemButton
            key={ch.id}
            onClick={() => handleClick(ch.id)}
            selected={activeId === ch.id}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              py: 0.75,
              '&.Mui-selected': {
                backgroundColor: 'primary.50',
                color: 'primary.main',
                fontWeight: 600,
              },
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontSize: '0.85rem',
                fontWeight: activeId === ch.id ? 600 : 400,
              }}
            >
              {index + 1}. {ch.title}
            </Typography>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
