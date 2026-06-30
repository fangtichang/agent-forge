import { logger } from '../logger.js';

/**
 * Task Planner Service �?orchestrates topic decomposition via LLM.
 */
import { decomposeTopic } from './llmClient.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { SubTask } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

/** Decompose a topic into 4-5 research sub-tasks. */
export async function planTasks(topic: string): Promise<SubTask[]> {
  if (!topic || topic.trim().length === 0) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      'Topic cannot be empty',
      400,
    );
  }

  if (topic.length > 500) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      'Topic must be under 500 characters',
      400,
    );
  }

  logger.info(`[TaskPlanner] Decomposing topic: "${topic}"`);

  const tasks = await decomposeTopic(topic);

  // Assign IDs and ensure minimum of 3 tasks
  const subTasks: SubTask[] = tasks.map((t) => ({
    id: uuidv4(),
    title: t.title,
    query: t.query,
    searchTerms: t.searchTerms,
  }));

  if (subTasks.length < 3) {
    // Fallback: generate default sub-tasks if LLM returned too few
    return generateDefaultTasks(topic);
  }

  logger.info(`[TaskPlanner] Generated ${subTasks.length} sub-tasks`);
  return subTasks;
}

/** Generate default sub-tasks as fallback when LLM fails. */
function generateDefaultTasks(topic: string): SubTask[] {
  const templates = [
    { title: `${topic} — 市场概览与现状`, query: `${topic} 市场规模 发展现状 2025`, searchTerms: [topic, '市场规模', '发展现状', '行业报告'] },
    { title: `${topic} — 竞争格局与主要玩家`, query: `${topic} 竞争格局 龙头企业 市场份额`, searchTerms: [topic, '竞争格局', '龙头企业', '市场份额'] },
    { title: `${topic} — 技术趋势与创新方向`, query: `${topic} 技术趋势 创新 研发方向`, searchTerms: [topic, '技术趋势', '创新', '研发'] },
    { title: `${topic} — 风险挑战与政策环境`, query: `${topic} 风险 挑战 政策法规`, searchTerms: [topic, '风险', '政策', '监管'] },
    { title: `${topic} — 未来展望与投资机会`, query: `${topic} 未来趋势 投资机会 发展预测`, searchTerms: [topic, '未来展望', '投资机会', '预测'] },
  ];

  return templates.map((t) => ({
    id: uuidv4(),
    title: t.title,
    query: t.query,
    searchTerms: t.searchTerms,
  }));
}