/**
 * @license
 * Copyright 2026 o1-code contributors
 * SPDX-License-Identifier: Apache-2.0
 */
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFrameCoalescedFlush } from './use-frame-coalesced-flush.js';

describe('useFrameCoalescedFlush', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the first flush immediately and coalesces the rest into the next frame', () => {
    const flush = vi.fn();
    const { result } = renderHook(() => useFrameCoalescedFlush(flush, 16));

    result.current.schedule();
    expect(flush).toHaveBeenCalledTimes(1);

    result.current.schedule();
    result.current.schedule();
    result.current.schedule();
    expect(flush).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(16);
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('does not flush again after a quiet frame', () => {
    const flush = vi.fn();
    const { result } = renderHook(() => useFrameCoalescedFlush(flush, 16));

    result.current.schedule();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    expect(flush).toHaveBeenCalledTimes(1);

    // A later call starts a new window and runs immediately again.
    result.current.schedule();
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('keeps flushing once per frame while a burst continues', () => {
    const flush = vi.fn();
    const { result } = renderHook(() => useFrameCoalescedFlush(flush, 16));

    for (let frame = 0; frame < 4; frame++) {
      for (let i = 0; i < 5; i++) {
        result.current.schedule();
        vi.advanceTimersByTime(3);
      }
    }
    vi.advanceTimersByTime(16);
    // 4 frames of 15 ms each: one leading flush, then one per frame window.
    expect(flush.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(flush.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it('cancel drops the pending trailing flush', () => {
    const flush = vi.fn();
    const { result } = renderHook(() => useFrameCoalescedFlush(flush, 16));

    result.current.schedule();
    result.current.schedule();
    result.current.cancel();
    vi.advanceTimersByTime(32);
    expect(flush).toHaveBeenCalledTimes(1);
  });
});
