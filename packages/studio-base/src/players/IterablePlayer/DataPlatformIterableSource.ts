// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEqual } from "lodash";

import Logger from "@foxglove/log";
import { parseChannel } from "@foxglove/mcap-support";
import {
  add,
  clampTime,
  compare,
  fromRFC3339String,
  fromSec,
  isGreaterThan,
  isLessThan,
  Time,
  toRFC3339String,
} from "@foxglove/rostime";
import streamMessages, {
  ParsedChannelAndEncodings,
} from "@foxglove/studio-base/players/FoxgloveDataPlatformPlayer/streamMessages";
import { PlayerProblem, Topic, MessageEvent } from "@foxglove/studio-base/players/types";
import ConsoleApi from "@foxglove/studio-base/services/ConsoleApi";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import { formatTimeRaw } from "@foxglove/studio-base/util/time";

import {
  IIterableSource,
  Initalization,
  MessageIteratorArgs,
  IteratorResult,
} from "./IIterableSource";

const log = Logger.getLogger(__filename);

type DataPlatformIterableSourceOptions = {
  api: ConsoleApi;
  deviceId: string;
  start: Time;
  end: Time;
};

export class DataPlatformIterableSource implements IIterableSource {
  private readonly _consoleApi: ConsoleApi;
  private _start: Time;
  private _end: Time;
  private _deviceId: string;
  private readonly _requestDurationSecs = 15;

  /**
   * Cached readers for each schema so we don't have to re-parse definitions on each stream request.
   * Although each topic is usually homogeneous, technically it is possible to have different
   * encoding or schema for each topic, so we store all the ones we've seen.
   */
  private _parsedChannelsByTopic = new Map<string, ParsedChannelAndEncodings[]>();

  constructor(options: DataPlatformIterableSourceOptions) {
    this._consoleApi = options.api;
    this._start = options.start;
    this._end = options.end;
    this._deviceId = options.deviceId;
  }

  async initialize(): Promise<Initalization> {
    const [coverage, rawTopics] = await Promise.all([
      this._consoleApi.coverage({
        deviceId: this._deviceId,
        start: toRFC3339String(this._start),
        end: toRFC3339String(this._end),
      }),
      this._consoleApi.topics({
        deviceId: this._deviceId,
        start: toRFC3339String(this._start),
        end: toRFC3339String(this._end),
        includeSchemas: true,
      }),
    ]);
    if (rawTopics.length === 0 || coverage.length === 0) {
      throw new Error(
        `No data available for ${this._deviceId} between ${formatTimeRaw(
          this._start,
        )} and ${formatTimeRaw(this._end)}.`,
      );
    }

    // Truncate start/end time to coverage range
    const coverageStart = fromRFC3339String(coverage[0]!.start);
    const coverageEnd = fromRFC3339String(coverage[coverage.length - 1]!.end);
    if (!coverageStart || !coverageEnd) {
      throw new Error(
        `Invalid coverage response, start: ${coverage[0]!.start}, end: ${
          coverage[coverage.length - 1]!.end
        }`,
      );
    }
    if (isLessThan(this._start, coverageStart)) {
      log.debug("Reduced start time from", this._start, "to", coverageStart);
      this._start = coverageStart;
    }
    if (isGreaterThan(this._end, coverageEnd)) {
      log.debug("Reduced end time from", this._end, "to", coverageEnd);
      this._end = coverageEnd;
    }

    const topics: Topic[] = [];
    const datatypes: RosDatatypes = new Map();
    const problems: PlayerProblem[] = [];
    rawTopics: for (const rawTopic of rawTopics) {
      const { topic, encoding: messageEncoding, schemaEncoding, schema, schemaName } = rawTopic;
      if (schema == undefined) {
        problems.push({ message: `Missing schema for ${topic}`, severity: "error" });
        continue;
      }

      let parsedChannels = this._parsedChannelsByTopic.get(topic);
      if (!parsedChannels) {
        parsedChannels = [];
        this._parsedChannelsByTopic.set(topic, parsedChannels);
      }
      for (const info of parsedChannels) {
        if (
          info.messageEncoding === messageEncoding &&
          info.schemaEncoding === schemaEncoding &&
          isEqual(info.schema, schema)
        ) {
          continue rawTopics;
        }
      }

      const parsedChannel = parseChannel({
        messageEncoding,
        schema: { name: schemaName, data: schema, encoding: schemaEncoding },
      });

      topics.push({ name: topic, datatype: parsedChannel.fullSchemaName });
      parsedChannels.push({ messageEncoding, schemaEncoding, schema, parsedChannel });

      // Final datatypes is an unholy union of schemas across all channels
      for (const [name, datatype] of parsedChannel.datatypes) {
        datatypes.set(name, datatype);
      }
    }

    return {
      topics,
      datatypes,
      start: this._start,
      end: this._end,
      problems,
      publishersByTopic: new Map(),
    };
  }

  private _currentStream?: {
    startTime: Time;
    endTime: Time;
    topics: string[];
    //FIXME
    lastResult: (MessageEvent<unknown> & { channelId: number })[] | undefined;
    iterator: AsyncIterator<(MessageEvent<unknown> & { channelId: number })[]>;
    controller: AbortController;
  };

  async *messageIterator(args: MessageIteratorArgs): AsyncIterator<Readonly<IteratorResult>> {
    if (args.reverse === true) {
      return;
    }
    const api = this._consoleApi;
    const deviceId = this._deviceId;
    const parsedChannelsByTopic = this._parsedChannelsByTopic;

    let currentStart = args.start ?? this._start;

    // determine whether we can use the existing stream
    if (isEqual(this._currentStream?.topics, args.topics) && this._currentStream?.lastResult) {
      const firstTime = this._currentStream.lastResult[0]?.receiveTime;
      // [0 1 2 2] [2 3 4] + request starttime = 2 FIXME better comment
      if (
        firstTime &&
        compare(currentStart, firstTime) > 0 &&
        compare(currentStart, this._currentStream.endTime) <= 0
      ) {
        for (const message of this._currentStream.lastResult) {
          if (compare(message.receiveTime, currentStart) < 0) {
            continue;
          }
          yield { connectionId: message.channelId, msgEvent: message, problem: undefined };
        }
      } else {
        this._currentStream.controller.abort();
        this._currentStream = undefined;
      }
    } else {
      this._currentStream?.controller.abort();
      this._currentStream = undefined;
    }

    let currentEnd = clampTime(
      add(currentStart, fromSec(this._requestDurationSecs)),
      this._start,
      this._end,
    );

    for (;;) {
      if (!this._currentStream) {
        const controller = new AbortController();
        this._currentStream = {
          startTime: currentStart,
          endTime: currentEnd,
          topics: args.topics,
          lastResult: undefined,
          controller,
          iterator: streamMessages({
            api,
            signal: controller.signal,
            parsedChannelsByTopic,
            params: { deviceId, start: currentStart, end: currentEnd, topics: args.topics },
          }),
        };
      }
      for (
        let result;
        (result = await this._currentStream.iterator.next()), result.done !== true;

      ) {
        this._currentStream.lastResult = result.value;
        for (const message of result.value) {
          yield { connectionId: message.channelId, msgEvent: message, problem: undefined };
        }
      }
      this._currentStream = undefined;

      if (compare(currentEnd, this._end) >= 0) {
        break;
      }
      currentStart = currentEnd;
      currentEnd = clampTime(
        add(currentStart, fromSec(this._requestDurationSecs)),
        this._start,
        this._end,
      );
    }
  }
  /*
  async *messageIterator(args: MessageIteratorArgs): AsyncIterator<Readonly<IteratorResult>> {
    if (args.reverse === true) {
      return;
    }

    const api = this._consoleApi;
    const deviceId = this._deviceId;
    const parsedChannelsByTopic = this._parsedChannelsByTopic;

    let currentStart = args.start ?? this._start;
    while (isLessThan(currentStart, this._end)) {
      const currentEnd = clampTime(
        add(currentStart, fromSec(this._requestDurationSecs)),
        this._start,
        this._end,
      );

      const controller = new AbortController();
      try {
        const stream = streamMessages({
          api,
          signal: controller.signal,
          parsedChannelsByTopic,
          params: { deviceId, start: currentStart, end: currentEnd, topics: args.topics },
        });
        for await (const messages of stream) {
          for (const message of messages) {
            yield { connectionId: message.channelId, msgEvent: message, problem: undefined };
          }
        }
      } finally {
        // If the player stops our execution early by calling the iterator's `return()` method,
        // cancel any outstanding request
        controller.abort();
      }
      currentStart = currentEnd;
    }
  }
  */
}
