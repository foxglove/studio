// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import Log from "@foxglove/log";

const log = Log.getLogger(__filename);

type Stats = {
  medianFrameMs: number;
  avgFrameMs: number;
  p90FrameMs: number;
  stddev: number;
};

type RecordPlaybackStatsFn = (stats: Stats) => void;

class BenchmarkStats {
  private static instance: BenchmarkStats | undefined;

  private constructor() {}

  public record(stats: Stats): void {
    log.info(
      `Frame time (filtered) average: ${stats.avgFrameMs}, median: ${stats.medianFrameMs}, P90: ${stats.p90FrameMs}, stddev: ${stats.stddev}`,
    );

    const record = (window as { recordPlaybackStats?: RecordPlaybackStatsFn }).recordPlaybackStats;
    record?.(stats);
  }

  /** Return an instance of BenchmarkStats */
  public static Instance(): BenchmarkStats {
    BenchmarkStats.instance = BenchmarkStats.instance ?? new BenchmarkStats();
    return BenchmarkStats.instance;
  }
}

export { BenchmarkStats };
