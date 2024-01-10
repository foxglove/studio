// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";
import EventEmitter from "eventemitter3";
import * as _ from "lodash-es";

import { MessageEvent } from "@foxglove/studio";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { PlotConfig } from "@foxglove/studio-base/panels/Plot/types";
import {
  MessageBlock,
  PlayerPresence,
  PlayerState,
  PlayerStateActiveData,
} from "@foxglove/studio-base/players/types";

import { CustomDatasetsBuilder } from "./CustomDatasetsBuilder";
import { CustomDatasetsBuilderImpl } from "./CustomDatasetsBuilderImpl";

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
    Comlink.expose(new CustomDatasetsBuilderImpl(), this.#server);
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

function groupByTopic(events: MessageEvent[]): Record<string, MessageEvent[]> {
  return _.groupBy(events, (item) => item.topic);
}

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

describe("CustomDatasetsBuilder", () => {
  it("should dataset from current messages", async () => {
    const builder = new CustomDatasetsBuilder();

    builder.setXPath(parseRosPath("/foo.val"));
    builder.setConfig(
      buildPlotConfig({
        paths: [
          {
            enabled: true,
            timestampMethod: "receiveTime",
            value: "/bar.val",
          },
        ],
      }),
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
            receiveTime: { sec: 0, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 1,
            },
          },
          {
            topic: "/bar",
            schemaName: "bar",
            receiveTime: { sec: 0, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 0,
            },
          },
        ],
      }),
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
              val: 2,
            },
          },
          {
            topic: "/bar",
            schemaName: "bar",
            receiveTime: { sec: 0, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 1,
            },
          },
          {
            topic: "/bar",
            schemaName: "bar",
            receiveTime: { sec: 0, nsec: 0 },
            sizeInBytes: 0,
            message: {
              val: 2,
            },
          },
        ],
      }),
    );

    const datasets = await builder.getViewportDatasets({
      size: { width: 1_000, height: 1_000 },
      bounds: {},
    });

    expect(datasets).toMatchObject([
      {
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
        showLine: true,
        pointRadius: 1.2,
        fill: false,
      },
    ]);
  });

  it("should build updates from blocks", async () => {
    const builder = new CustomDatasetsBuilder();

    builder.setXPath(parseRosPath("/foo.val"));
    builder.setConfig(
      buildPlotConfig({
        paths: [
          {
            enabled: true,
            timestampMethod: "receiveTime",
            value: "/bar.val",
            lineSize: 1.0,
          },
        ],
      }),
      {},
    );

    const block0 = {
      sizeInBytes: 0,
      messagesByTopic: groupByTopic([
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
          receiveTime: { sec: 0, nsec: 0 },
          sizeInBytes: 0,
          message: {
            val: 1,
          },
        },
        {
          topic: "/bar",
          schemaName: "bar",
          receiveTime: { sec: 0, nsec: 0 },
          sizeInBytes: 0,
          message: {
            val: 0,
          },
        },
      ]),
    };

    const block1 = {
      sizeInBytes: 0,
      messagesByTopic: groupByTopic([
        {
          topic: "/foo",
          schemaName: "foo",
          receiveTime: { sec: 0, nsec: 0 },
          sizeInBytes: 0,
          message: {
            val: 2,
          },
        },
        {
          topic: "/bar",
          schemaName: "bar",
          receiveTime: { sec: 0, nsec: 0 },
          sizeInBytes: 0,
          message: {
            val: 1,
          },
        },
        {
          topic: "/bar",
          schemaName: "bar",
          receiveTime: { sec: 0, nsec: 0 },
          sizeInBytes: 0,
          message: {
            val: 2,
          },
        },
      ]),
    };

    builder.handlePlayerState(buildPlayerState({}, [block0]));
    builder.handlePlayerState(buildPlayerState({}, [block0, block1]));

    const datasets = await builder.getViewportDatasets({
      size: { width: 1_000, height: 1_000 },
      bounds: {},
    });

    expect(datasets).toMatchObject([
      {
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
        showLine: true,
        pointRadius: 1.2,
        fill: false,
      },
    ]);
  });
});
