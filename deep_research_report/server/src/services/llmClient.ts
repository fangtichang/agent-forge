/**
 * LLM Client — OpenAI SDK wrapper with retries, timeout, and streaming.
 */
import OpenAI from 'openai';
import { config } from '../config.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { Citation } from '../types/index.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: config.llm.apiKey,
      timeout: config.llm.timeout,
      maxRetries: config.llm.maxRetries,
    }
    if (config.llm.baseURL) {
      clientConfig.baseURL = config.llm.baseURL;
    });
  }
  return client;
}

/** Decompose a research topic into sub-tasks using LLM. */
export async function decomposeTopic(topic: string): Promise<
  Array<{ title: string; query: string; searchTerms: string[] }>
> {
  const openai = getClient();

  const systemPrompt = `你是一个行业研究专家。请将研究话题拆解为4-5个关键子任务，每个子任务包含研究标题、搜索查询词和多个搜索关键词。

输出格式为严格 JSON 数组：
[
  {
    "title": "子任务标题",
    "query": "搜索查询语句",
    "searchTerms": ["关键词1", "关键词2", "关键词3"]
  }
]

要求：
- 子任务之间逻辑递进，覆盖市场概况、竞争格局、技术趋势、风险挑战、未来展望
- 搜索查询语句使用中文，精确到可执行的搜索
- 每个子任务提供3-4个搜索关键词`;

  try {
    const response = await openai.chat.completions.create({
      model: config.llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请拆解以下研究话题：${topic}` },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AppError(ErrorCode.LLM_ERROR, 'LLM returned empty response', 502);
    }

    // Parse JSON response — GPT-4o with json_object wraps in {"subTasks": [...]}
    const parsed = JSON.parse(content);
    const tasks = parsed.subTasks || parsed;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new AppError(ErrorCode.LLM_ERROR, 'LLM returned invalid task structure', 502);
    }

    return tasks.slice(0, 5).map((t: any, i: number) => ({
      title: t.title || `子任务 ${i + 1}`,
      query: t.query || t.title || '',
      searchTerms: Array.isArray(t.searchTerms) ? t.searchTerms : [],
    }));
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ErrorCode.LLM_ERROR,
      `LLM decompose failed: ${(err as Error).message}`,
      502,
    );
  }
}

/** Generate chapter content with streaming. */
export async function* generateChapterStream(
  chapterTitle: string,
  chapterOutline: string,
  searchContext: string,
): AsyncGenerator<{ chunk: string; citations?: Citation[] }> {
  const openai = getClient();

  const systemPrompt = `你是一个行业研究分析师，正在撰写深度研究报告的章节。

写作要求：
1. 专业、客观、数据驱动
2. 使用 Markdown 格式（标题、列表、表格）
3. 引用来源时使用标记 [citation:序号]
4. 每段2-3句话，避免过长段落
5. 包含具体数据、公司名称、时间节点

搜索上下文会提供相关来源，请基于这些信息撰写，同时结合你的知识补充。`;

  const userPrompt = `请撰写以下章节：
章节标题：${chapterTitle}
章节大纲：${chapterOutline}

搜索上下文（参考来源）：
${searchContext}

请开始撰写。`;

  try {
    const stream = await openai.chat.completions.create({
      model: config.llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.llm.temperature,
      max_tokens: config.llm.maxTokens,
      stream: true,
    });

    let buffer = '';
    let citationIndex = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (!delta) continue;

      buffer += delta;

      // Extract citations from the buffer in [citation:N] format
      const citations: Citation[] = [];
      const citationRegex = /\[citation:(\d+)\]/g;
      let match;

      while ((match = citationRegex.exec(buffer)) !== null) {
        const index = parseInt(match[1], 10);
        if (index > citationIndex) {
          citationIndex = index;
        }
      }

      yield { chunk: delta };
    }

    // Build citation list from search context references
    // In production, this would be extracted from the LLM output and matched
    // to actual search results stored in the report context.
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ErrorCode.LLM_ERROR,
      `LLM generation failed: ${(err as Error).message}`,
      502,
    );
  }
}

/** Generate follow-up answer with streaming. */
export async function* generateFollowUpStream(
  question: string,
  contextParagraph: string,
  parentQA?: { question: string; answer: string },
): AsyncGenerator<{ chunk: string }> {
  const openai = getClient();

  const systemPrompt = `你是一个行业研究助手，正在回答用户对研究报告的追问。
要求：
1. 基于上下文精确回答
2. 补充相关数据和分析
3. 使用 Markdown 格式
4. 如果不确定，诚实说明`;

  let context = `报告段落：\n${contextParagraph}`;
  if (parentQA) {
    context += `\n\n上一轮追问：\n问：${parentQA.question}\n答：${parentQA.answer}`;
  }

  try {
    const stream = await openai.chat.completions.create({
      model: config.llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${context}\n\n用户追问：${question}` },
      ],
      temperature: 0.5,
      max_tokens: 1500,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (!delta) continue;
      yield { chunk: delta };
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ErrorCode.LLM_ERROR,
      `LLM follow-up failed: ${(err as Error).message}`,
      502,
    );
  }
}

/** Health check for LLM service. */
export async function checkLLMHealth(): Promise<boolean> {
  try {
    const openai = getClient();
    const response = await openai.models.list();
    return response.data.length > 0;
  } catch {
    return false;
  }
}
