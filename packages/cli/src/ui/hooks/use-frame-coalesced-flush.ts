/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef } from 'react';

/** One 60Hz frame — the coalescing window for burst scroll input. */
export const SCROLL_FRAME_MS = 16;

/**
 * Coalesces a burst of input into at most one `flush` per frame, with the
 * first call of a burst running at once.
 *
 * Terminal mouse reporting and key repeat deliver one event per row or per
 * repeat; applying each one synchronously forced one reflow and one terminal
 * write per event. A trailing-only timer removed the storm but made every
 * burst, including a single wheel tick, wait a whole frame before anything
 * moved. This is a leading-and-trailing throttle instead: the first call
 * flushes immediately and opens a frame window; calls inside the window only
 * mark the window dirty; when the window closes, a dirty window flushes once
 * and opens the next one, so a sustained burst lands once per frame and a
 * quiet window just ends.
 *
 * Callers accumulate the intent (deltas, latest row) in refs and read it in
 * `flush`, so a flush with nothing pending must be a no-op for them.
 */
export function useFrameCoalescedFlush(
  flush: () => void,
  frameMs: number = SCROLL_FRAME_MS,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const closeWindow = useCallback(() => {
    timer.current = null;
    if (!dirty.current) {
      return;
    }
    dirty.current = false;
    flushRef.current();
    // The trailing flush opens a new window so the next event of a still
    // running burst coalesces instead of flushing on its own.
    timer.current = setTimeout(closeWindow, frameMs);
  }, [frameMs]);

  const schedule = useCallback(() => {
    if (timer.current !== null) {
      dirty.current = true;
      return;
    }
    flushRef.current();
    timer.current = setTimeout(closeWindow, frameMs);
  }, [closeWindow, frameMs]);

  const cancel = useCallback(() => {
    dirty.current = false;
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}
