import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TurndownService from 'turndown';
import type { Report } from '@/types';

/** Props for ExportButton component. */
interface ExportButtonProps {
  /** The report to export. */
  report: Report;
}

/**
 * Export button that downloads the report as a Markdown file.
 *
 * Uses turndown to build a clean Markdown document from the report data.
 * File name format: {topic}_深度研究报告_{date}.md
 */
export default function ExportButton({ report }: ExportButtonProps) {
  const handleExport = () => {
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    const dateStr = new Date(report.createdAt).toISOString().slice(0, 10);
    const safeTopic = report.topic.replace(/[\\/:*?"<>|]/g, '_');

    let md = `# ${report.topic} - 深度研究报告\n\n`;
    md += `> 生成日期：${dateStr}\n`;
    md += `> 报告ID：${report.id}\n\n`;
    md += `---\n\n`;

    // Table of contents
    md += `## 目录\n\n`;
    report.chapters.forEach((ch, idx) => {
      md += `${idx + 1}. [${ch.title}](#章节${idx + 1})\n`;
    });
    md += '\n---\n\n';

    // Chapter content
    for (const chapter of report.chapters) {
      // The chapter content is already Markdown
      md += chapter.content;
      md += '\n\n';

      // Citations
      if (chapter.citations.length > 0) {
        md += `**引用来源：**\n\n`;
        for (const c of chapter.citations) {
          md += `- [${c.id}] [${c.title}](${c.url}) - ${c.snippet}\n`;
        }
        md += '\n';
      }

      md += '---\n\n';
    }

    // Collect all unique citations
    const allCitations = new Map<number, { title: string; url: string; snippet: string }>();
    for (const ch of report.chapters) {
      for (const c of ch.citations) {
        if (!allCitations.has(c.id)) {
          allCitations.set(c.id, {
            title: c.title,
            url: c.url,
            snippet: c.snippet,
          });
        }
      }
    }

    // Full citation list
    if (allCitations.size > 0) {
      md += `## 全部引用来源\n\n`;
      for (const [id, c] of allCitations) {
        md += `[${id}] **${c.title}**\n`;
        md += `  ${c.url}\n`;
        md += `  ${c.snippet}\n\n`;
      }
    }

    // Create blob and trigger download
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTopic}_深度研究报告_${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      size="small"
      sx={{ borderRadius: 2 }}
    >
      导出 Markdown
    </Button>
  );
}
