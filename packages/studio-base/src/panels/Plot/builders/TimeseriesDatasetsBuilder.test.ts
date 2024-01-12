// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";
import EventEmitter from "eventemitter3";

import { PlotConfig } from "@foxglove/studio-base/panels/Plot/types";
import {
  MessageBlock,
  PlayerPresence,
  PlayerState,
  PlayerStateActiveData,
} from "@foxglove/studio-base/players/types";

import { TimeseriesDatasetsBuilder } from "./TimeseriesDatasetsBuilder";
import { TimeseriesDatasetsBuilderImpl } from "./TimeseriesDatasetsBuilderImpl";

class WorkerEndpoint extends EventEmitter {
  #client: Worker;

  public constructor(client: Worker) {
    super();

    this.#client = client;
  }

  public postMessage(msg: unknown): void {
    this.#client.emit("message", {
      data: msg,
    });
  }

  public addEventListener(event: string, fn: () => void): void {
    this.on(event, fn);
  }

  public removeEventListener(event: string, fn: () => void): void {
    this.off(event, fn);
  }
}

class Worker extends EventEmitter {
  #server: WorkerEndpoint;
  public constructor() {
    super();

    this.#server = new WorkerEndpoint(this);
    Comlink.expose(new TimeseriesDatasetsBuilderImpl(), this.#server);
  }

  public postMessage(msg: unknown): void {
    this.#server.emit("message", {
      data: msg,
    });
  }

  public addEventListener(event: string, fn: () => void): void {
    this.on(event, fn);
  }

  public removeEventListener(event: string, fn: () => void): void {
    this.off(event, fn);
  }

  public terminate() {
    // no-op
  }
}

Object.defineProperty(global, "Worker", {
  writable: true,
  value: Worker,
});

function buildPlotConfig(override: Partial<PlotConfig>): PlotConfig {
  return {
    isSynced: true,
    legendDisplay: "floating",
    showLegend: true,
    showPlotValuesInLegend: false,
    showXAxisLabels: true,
    showYAxisLabels: true,
    sidebarDimension: 0,
    xAxisVal: "custom",
    paths: [],
    ...override,
  };
}

function buildPlayerState(
  activeDataOverride?: Partial<PlayerStateActiveData>,
  blocks?: readonly (MessageBlock | undefined)[],
): PlayerState {
  return {
    activeData: {
      messages: [],
      currentTime: { sec: 0, nsec: 0 },
      endTime: { sec: 0, nsec: 0 },
      lastSeekTime: 1,
      topics: [],
      speed: 1,
      isPlaying: false,
      topicStats: new Map(),
      startTime: { sec: 0, nsec: 0 },
      datatypes: new Map(),
      totalBytesReceived: 0,
      ...activeDataOverride,
    },
    capabilities: [],
    presence: PlayerPresence.PRESENT,
    profile: undefined,
    playerId: "1",
    progress: {
      fullyLoadedFractionRanges: [],
      messageCache: {
        blocks: blocks ?? [],
        startTime: { sec: 0, nsec: 0 },
      },
    },
  };
}

describe("TimeseriesDatasetsBuilder", () => {
  it("computes derivative inside and outside of viewport", async () => {
    const builder = new TimeseriesDatasetsBuilder();

    builder.setConfig(
      buildPlotConfig({
        paths: [
          {
            enabled: true,
            timestampMethod: "receiveTime",
            value: "/foo.val",
          },
          {
            enabled: true,
            timestampMethod: "receiveTime",
            value: "/foo.val.@derivative",
          },
        ],
      }),
      "light",
      {},
    );

    builder.handlePlayerState(
      buildPlayerState({
        messages: [
          {
            topic: "/foo",
            schemaName: "foo",
            receiveTime: { sec: 0, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 0,
            },
          },
          {
            topic: "/foo",
            schemaName: "foo",
            receiveTime: { sec: 0.5, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 1,
            },
          },
          {
            topic: "/foo",
            schemaName: "foo",
            receiveTime: { sec: 1, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 1.5,
            },
          },
          {
            topic: "/foo",
            schemaName: "foo",
            receiveTime: { sec: 2, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 2.5,
            },
          },
        ],
      }),
    );

    await expect(
      builder.getViewportDatasets({
        size: { width: 1_000, height: 1_000 },
        bounds: {},
      }),
    ).resolves.toEqual({
      pathsWithMismatchedDataLengths: new Set(),
      datasets: [
        expect.objectContaining({
          data: [
            { x: NaN, y: NaN, value: NaN },
            { x: NaN, y: NaN, value: NaN },
            { x: NaN, y: NaN, value: NaN },
            { x: NaN, y: NaN, value: NaN },
            { x: 0, y: 0, value: 0 },
            { x: 0.5, y: 1, value: 1 },
            { x: 1, y: 1.5, value: 1.5 },
            { x: 2, y: 2.5, value: 2.5 },
          ],
        }),
        expect.objectContaining({
          data: [
            { x: 0, y: NaN, value: NaN },
            { x: 0, y: NaN, value: NaN },
            { x: 0, y: NaN, value: NaN },
            { x: 0, y: NaN, value: NaN },
            { x: 0.5, y: 2, value: 2 },
            { x: 1, y: 1, value: 1 },
            { x: 2, y: 1, value: 1 },
          ],
        }),
      ],
    });

    await expect(
      builder.getViewportDatasets({
        size: { width: 1_000, height: 1_000 },
        bounds: {
          x: { min: 0.2 },
        },
      }),
    ).resolves.toEqual({
      pathsWithMismatchedDataLengths: new Set(),
      datasets: [
        expect.objectContaining({
          data: [
            { x: 0, y: 0, value: 0 },
            { x: 0.5, y: 1, value: 1 },
            { x: 1, y: 1.5, value: 1.5 },
            { x: 2, y: 2.5, value: 2.5 },
          ],
        }),
        expect.objectContaining({
          data: [
            { x: 0, y: NaN, value: NaN },
            { x: 0, y: NaN, value: NaN },
            { x: 0, y: NaN, value: NaN },
            { x: 0, y: NaN, value: NaN },
            { x: 0.5, y: 2, value: 2 },
            { x: 1, y: 1, value: 1 },
            { x: 2, y: 1, value: 1 },
          ],
        }),
      ],
    });

    await expect(
      builder.getViewportDatasets({
        size: { width: 1_000, height: 1_000 },
        bounds: {
          x: { min: 0.75 },
        },
      }),
    ).resolves.toEqual({
      pathsWithMismatchedDataLengths: new Set(),
      datasets: [
        expect.objectContaining({
          data: [
            { x: 0.5, y: 1, value: 1 },
            { x: 1, y: 1.5, value: 1.5 },
            { x: 2, y: 2.5, value: 2.5 },
          ],
        }),
        expect.objectContaining({
          data: [
            { x: 0.5, y: 2, value: 2 },
            { x: 1, y: 1, value: 1 },
            { x: 2, y: 1, value: 1 },
          ],
        }),
      ],
    });

    await expect(
      builder.getViewportDatasets({
        size: { width: 1_000, height: 1_000 },
        bounds: {
          x: { min: 1.2 },
        },
      }),
    ).resolves.toEqual({
      pathsWithMismatchedDataLengths: new Set(),
      datasets: [
        expect.objectContaining({
          data: [
            { x: 1, y: 1.5, value: 1.5 },
            { x: 2, y: 2.5, value: 2.5 },
          ],
        }),
        expect.objectContaining({
          data: [
            { x: 1, y: 1, value: 1 },
            { x: 2, y: 1, value: 1 },
          ],
        }),
      ],
    });
  });
});
