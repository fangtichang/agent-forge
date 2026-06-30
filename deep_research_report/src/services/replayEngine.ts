import type {
  SearchProgressEvent,
  GenerateChunkEvent,
} from '@/types';
import { REPORT_CONFIG } from '@/constants';

/** Callback invoked when a replay event is emitted. */
export type ReplayEventCallback = (
  event: SearchProgressEvent | GenerateChunkEvent,
) => void;

/**
 * ReplayEngine drives mock SSE event replay with play/pause/resume/speed control.
 *
 * Uses setTimeout chains with Date.now() delta calculations to accurately
 * simulate real-time event streaming. Supports variable playback speed.
 */
export class ReplayEngine {
  private events: { delay: number; data: SearchProgressEvent | { chapterId: string; chunk: string; citations?: never } }[];
  private onEvent: ReplayEventCallback;
  private speed: number;
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private currentIndex: number = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private startTime: number = 0;
  private elapsedBeforePause: number = 0;

  /**
   * @param events - Ordered array of timed events to replay
   * @param onEvent - Callback invoked for each event
   * @param speed - Playback speed multiplier (default 1)
   */
  constructor(
    events: { delay: number; data: SearchProgressEvent | { chapterId: string; chunk: string } }[],
    onEvent: ReplayEventCallback,
    speed: number = REPORT_CONFIG.DEFAULT_REPLAY_SPEED,
  ) {
    this.events = events;
    this.onEvent = onEvent;
    this.speed = speed;
  }

  /** Start or resume playback from the current position. */
  play(): void {
    if (this.isStopped) return;
    this.isPaused = false;
    this.startTime = Date.now();
    this.scheduleNext();
  }

  /** Pause playback, preserving current position. */
  pause(): void {
    this.isPaused = true;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.elapsedBeforePause += Date.now() - this.startTime;
  }

  /** Resume playback from the paused position. */
  resume(): void {
    if (this.isStopped || !this.isPaused) return;
    this.play();
  }

  /**
   * Set playback speed.
   * @param speed - New speed multiplier (> 0)
   */
  setSpeed(speed: number): void {
    if (speed <= 0) return;
    const wasPlaying = !this.isPaused && !this.isStopped;
    if (wasPlaying) this.pause();
    this.speed = speed;
    if (wasPlaying) this.resume();
  }

  /** Stop playback and clean up. */
  stop(): void {
    this.isStopped = true;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /** Reset to the beginning. */
  reset(): void {
    this.stop();
    this.isStopped = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.elapsedBeforePause = 0;
  }

  /**
   * Schedule the next event in the sequence.
   *
   * Events carry absolute cumulative delays from the replay start.
   * The remaining delay for each event = targetTime - totalElapsed,
   * where totalElapsed = elapsedBeforePause + (Date.now() - startTime).
   * This ensures correct timing for both normal playback and pause/resume.
   */
  private scheduleNext(): void {
    if (this.isStopped || this.isPaused) return;
    if (this.currentIndex >= this.events.length) return;

    const event = this.events[this.currentIndex];
    const targetTime = event.delay / this.speed;
    const now = Date.now();
    const elapsedSinceResume = now - this.startTime;
    const totalElapsed = this.elapsedBeforePause + elapsedSinceResume;
    const remainingDelay = Math.max(0, targetTime - totalElapsed);

    this.timerId = setTimeout(() => {
      if (this.isStopped || this.isPaused) return;
      this.onEvent(event.data as SearchProgressEvent | GenerateChunkEvent);
      this.currentIndex++;
      this.scheduleNext();
    }, remainingDelay);
  }

  /** Whether playback has completed. */
  get isComplete(): boolean {
    return this.currentIndex >= this.events.length;
  }
}
