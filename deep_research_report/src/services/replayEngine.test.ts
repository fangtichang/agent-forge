import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReplayEngine } from './replayEngine';
import type { SearchProgressEvent, GenerateChunkEvent } from '@/types';

// Fake timers for setTimeout control
function createTestEvents(count: number) {
  const events: { delay: number; data: SearchProgressEvent }[] = [];
  for (let i = 0; i < count; i++) {
    events.push({
      delay: (i + 1) * 100,
      data: { subTaskId: `st_${i + 1}`, sourcesFound: i * 3 + 2 },
    });
  }
  return events;
}

describe('ReplayEngine', () => {
  let engine: ReplayEngine;
  let onEvent: ReturnType<typeof vi.fn>;
  let events: ReturnType<typeof createTestEvents>;

  beforeEach(() => {
    vi.useFakeTimers();
    onEvent = vi.fn();
    events = createTestEvents(3);
    engine = new ReplayEngine(events, onEvent, 1);
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  describe('play()', () => {
    it('should emit events in order with correct timing', () => {
      engine.play();

      // First event at delay=100
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith(events[0].data);

      // Second event at delay=200 (100ms after first)
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent).toHaveBeenCalledWith(events[1].data);

      // Third event at delay=300 (100ms after second)
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledTimes(3);
      expect(onEvent).toHaveBeenCalledWith(events[2].data);
    });

    it('should not replay events if already stopped', () => {
      engine.stop();
      engine.play();
      vi.advanceTimersByTime(1000);
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('should set isComplete to true after all events', () => {
      engine.play();
      vi.advanceTimersByTime(500);
      expect(engine.isComplete).toBe(true);
    });

    it('should set isComplete to false before playback finishes', () => {
      engine.play();
      expect(engine.isComplete).toBe(false);
    });
  });

  describe('pause()', () => {
    it('should pause event emission', () => {
      engine.play();
      vi.advanceTimersByTime(100);
      onEvent.mockClear();

      engine.pause();
      vi.advanceTimersByTime(500);
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('should clear the active timer', () => {
      engine.play();
      vi.advanceTimersByTime(50); // Part way through first delay
      engine.pause();

      // Should not fire the rest of the timer
      vi.advanceTimersByTime(200);
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  describe('resume()', () => {
    it('should resume from paused position', () => {
      engine.play();
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledTimes(1);
      onEvent.mockClear();

      engine.pause();
      engine.resume();

      // Second event was at delay=200, time elapsed=100, so remaining ~100ms
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith(events[1].data);
    });

    it('should not resume if not paused', () => {
      engine.play();
      vi.advanceTimersByTime(50);
      // pause first, then resume
      engine.pause();
      onEvent.mockClear();
      // Calling resume multiple times should be safe
      engine.resume();
      engine.resume(); // second resume should be a no-op since already playing
      vi.advanceTimersByTime(150);
      // Should emit the second event
      expect(onEvent).toHaveBeenCalledWith(events[1].data);
    });

    it('should not resume if stopped', () => {
      engine.play();
      vi.advanceTimersByTime(100);
      engine.pause();
      engine.stop();
      engine.resume();
      vi.advanceTimersByTime(500);
      // No more events should fire
      expect(onEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('setSpeed()', () => {
    it('should speed up playback at 2x', () => {
      engine.setSpeed(2);

      // Clear any initial event
      engine.play();
      onEvent.mockClear();

      // At 2x speed, first event delay=100/2=50ms
      vi.advanceTimersByTime(50);
      expect(onEvent).toHaveBeenCalledWith(events[0].data);

      // Second event at 2x: delay=200/2=100, but 50ms elapsed, so 50ms remaining
      vi.advanceTimersByTime(50);
      expect(onEvent).toHaveBeenCalledWith(events[1].data);
    });

    it('should reject speed <= 0', () => {
      engine.play();
      vi.advanceTimersByTime(80);
      onEvent.mockClear();

      engine.setSpeed(0);
      // speed should remain unchanged
      expect(onEvent).not.toHaveBeenCalled();

      vi.advanceTimersByTime(30);
      // First event at original speed (delay=100, 80 elapsed, 20 remaining)
      expect(onEvent).toHaveBeenCalledWith(events[0].data);
    });

    it('should change speed while playing', () => {
      engine.play();
      vi.advanceTimersByTime(50); // Half of first 100ms delay at 1x
      onEvent.mockClear();

      engine.setSpeed(2);
      // Remaining 50ms at 2x = 25ms
      vi.advanceTimersByTime(25);
      expect(onEvent).toHaveBeenCalledWith(events[0].data);
    });
  });

  describe('stop()', () => {
    it('should stop all event emission', () => {
      engine.play();
      vi.advanceTimersByTime(100);
      onEvent.mockClear();

      engine.stop();
      vi.advanceTimersByTime(1000);
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('should set isStopped flag preventing further playback', () => {
      engine.stop();
      engine.play();
      vi.advanceTimersByTime(1000);
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('should reset to initial state', () => {
      engine.play();
      vi.advanceTimersByTime(200);
      onEvent.mockClear();

      engine.reset();
      expect(engine.isComplete).toBe(false);

      engine.play();
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledWith(events[0].data);
    });

    it('should allow playback after reset', () => {
      engine.play();
      vi.advanceTimersByTime(500); // Complete all events
      expect(engine.isComplete).toBe(true);

      engine.reset();
      expect(engine.isComplete).toBe(false);

      onEvent.mockClear();
      engine.play();
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledWith(events[0].data);
    });
  });

  describe('isComplete', () => {
    it('should return false before playback', () => {
      expect(engine.isComplete).toBe(false);
    });

    it('should return true after all events emitted', () => {
      engine.play();
      vi.advanceTimersByTime(500);
      expect(engine.isComplete).toBe(true);
    });

    it('should return false during playback', () => {
      engine.play();
      vi.advanceTimersByTime(150);
      expect(engine.isComplete).toBe(false);
    });

    it('should handle empty events list', () => {
      const emptyEngine = new ReplayEngine([], vi.fn());
      expect(emptyEngine.isComplete).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid play/pause/resume cycles', () => {
      engine.play();
      engine.pause();
      engine.resume();
      engine.pause();
      engine.resume();

      // After all the toggling, events should still work
      vi.advanceTimersByTime(100);
      expect(onEvent).toHaveBeenCalledWith(events[0].data);
    });

    it('should handle GenerateChunkEvent data type', () => {
      const chunkEvents: { delay: number; data: GenerateChunkEvent }[] = [
        { delay: 50, data: { chapterId: 'ch_1', chunk: 'hello', citations: [] } },
        { delay: 100, data: { chapterId: 'ch_1', chunk: ' world' } },
      ];
      const cb = vi.fn();
      const ce = new ReplayEngine(chunkEvents, cb);
      ce.play();
      vi.advanceTimersByTime(50);
      expect(cb).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(50);
      expect(cb).toHaveBeenCalledTimes(2);
    });
  });
});
