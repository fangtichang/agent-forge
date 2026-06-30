import type {
  IReportAPI,
  DecomposeEvent,
  SearchProgressEvent,
  GenerateChunkEvent,
  FollowUpRequest,
  ReplayScenario,
} from '@/types';
import { REPORT_CONFIG } from '@/constants';
import { ReplayEngine } from './replayEngine';
import replayScenario from '@/mockData/replayScenario_ai';

/**
 * MockAPIService provides a fully offline demonstration of the report
 * generation pipeline using pre-recorded replay data.
 *
 * Implements IReportAPI with simulated network delays and token-by-token
 * streaming for realistic UI behavior.
 */
export class MockAPIService implements IReportAPI {
  private scenario: ReplayScenario;

  constructor() {
    this.scenario = replayScenario as ReplayScenario;
  }

  /**
   * Simulate topic decomposition with a fixed delay.
   * Returns pre-recorded sub-tasks from the replay scenario.
   */
  async decompose(_topic: string): Promise<DecomposeEvent> {
    await this.delay(REPORT_CONFIG.MOCK_DECOMPOSE_DELAY_MS);
    return {
      subTasks: this.scenario.decompose.data,
    };
  }

  /**
   * Stream search progress events using ReplayEngine for timeline-based replay.
   */
  async *searchStream(): AsyncGenerator<SearchProgressEvent> {
    const engine = new ReplayEngine(
      this.scenario.searchEvents.map((e) => ({
        delay: e.delay,
        data: e.data,
      })),
      () => {},
    );

    let resolveNext: ((value: IteratorResult<SearchProgressEvent>) => void) | null = null;
    let done = false;

    engine['onEvent'] = (event: SearchProgressEvent | GenerateChunkEvent) => {
      if (resolveNext && 'subTaskId' in event) {
        const r = resolveNext;
        resolveNext = null;
        r({ value: event as SearchProgressEvent, done: false });
      }
    };

    // Override scheduleNext to detect completion
    const origSchedule = engine['scheduleNext'].bind(engine);
    engine['scheduleNext'] = function () {
      if (engine.isComplete) {
        if (resolveNext) {
          const r = resolveNext;
          resolveNext = null;
          r({ value: undefined as unknown as SearchProgressEvent, done: true });
        }
        done = true;
        return;
      }
      origSchedule();
    };

    engine.play();

    while (!done) {
      const result = await new Promise<IteratorResult<SearchProgressEvent>>((resolve) => {
        resolveNext = resolve;
        // Timeout safety: if engine stalls for 30s, force complete
        setTimeout(() => {
          if (resolveNext) {
            const r = resolveNext;
            resolveNext = null;
            r({ value: undefined as unknown as SearchProgressEvent, done: true });
          }
        }, 30000);
      });

      if (result.done) break;
      yield result.value;
    }

    engine.stop();
  }

  /**
   * Stream chapter generation chunks token-by-token with random intervals.
   */
  async *generateStream(chapterId: string): AsyncGenerator<GenerateChunkEvent> {
    const chunks = this.scenario.chapterStreams[chapterId];
    if (!chunks) return;

    for (const chunk of chunks) {
      const delay =
        Math.random() *
          (REPORT_CONFIG.MOCK_TOKEN_DELAY_MAX - REPORT_CONFIG.MOCK_TOKEN_DELAY_MIN) +
        REPORT_CONFIG.MOCK_TOKEN_DELAY_MIN;

      await this.delay(delay);

      yield {
        chapterId,
        chunk: chunk.chunk,
        citations: (chunk as Record<string, unknown>).citations as GenerateChunkEvent['citations'],
      };
    }
  }

  /**
   * Stream follow-up answer chunks from pre-recorded data.
   */
  async *followUpStream(req: FollowUpRequest): AsyncGenerator<GenerateChunkEvent> {
    // Find matching answer key by chapterId
    const answerKey = Object.keys(this.scenario.followUpAnswers).find((k) =>
      k.includes(req.chapterId),
    );

    if (!answerKey) return;

    const chunks = this.scenario.followUpAnswers[answerKey];
    for (const chunk of chunks) {
      const delay =
        Math.random() *
          (REPORT_CONFIG.MOCK_TOKEN_DELAY_MAX - REPORT_CONFIG.MOCK_TOKEN_DELAY_MIN) +
        REPORT_CONFIG.MOCK_TOKEN_DELAY_MIN;

      await this.delay(delay);

      yield {
        chapterId: req.chapterId,
        chunk: chunk.chunk,
        citations: (chunk as Record<string, unknown>).citations as GenerateChunkEvent['citations'],
      };
    }
  }

  /** Simple promise-based delay helper. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
