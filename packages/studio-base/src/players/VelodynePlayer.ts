// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { v4 as uuidv4 } from "uuid";

import { Sockets, UdpRemoteInfo, UdpSocketRenderer } from "@foxglove/electron-socket/renderer";
import Logger from "@foxglove/log";
import { Time, fromMillis, add as addTimes, toDate, fromDate, fromMicros } from "@foxglove/rostime";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import {
  AdvertiseOptions,
  MessageEvent,
  ParameterValue,
  Player,
  PlayerMetricsCollectorInterface,
  PlayerPresence,
  PlayerState,
  PlayerProblem,
  PublishPayload,
  SubscribePayload,
  Topic,
} from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import debouncePromise from "@foxglove/studio-base/util/debouncePromise";
import { Model, RawPacket, packetRate } from "@foxglove/velodyne-cloud";

const log = Logger.getLogger(__filename);

export const DEFAULT_VELODYNE_PORT = 2369;

const RPM = 600;
const PROBLEM_SOCKET_ERROR = "SOCKET_ERROR";
const TOPIC = "/velodyne_points";
const TOPICS: Topic[] = [{ name: TOPIC, datatype: "velodyne_msgs/VelodyneScan" }];
const DATATYPES: RosDatatypes = new Map(
  Object.entries({
    "velodyne_msgs/VelodyneScan": {
      name: "velodyne_msgs/VelodyneScan",
      definitions: [
        { type: "std_msgs/Header", name: "header", isArray: false, isComplex: true },
        { type: "velodyne_msgs/VelodynePacket", name: "packets", isArray: true, isComplex: true },
      ],
    },
    "velodyne_msgs/VelodynePacket": {
      name: "velodyne_msgs/VelodynePacket",
      definitions: [
        { type: "time", name: "stamp", isArray: false, isComplex: false },
        { type: "uint8", name: "data", isArray: true, arrayLength: 1206, isComplex: false },
      ],
    },
    "std_msgs/Header": {
      name: "std_msgs/Header",
      definitions: [
        { name: "seq", type: "uint32", isArray: false },
        { name: "stamp", type: "time", isArray: false },
        { name: "frame_id", type: "string", isArray: false },
      ],
    },
  }),
);
const CAPABILITIES: string[] = [];

type VelodynePlayerOpts = {
  port?: number;
  metricsCollector: PlayerMetricsCollectorInterface;
};

export default class VelodynePlayer implements Player {
  #id: string = uuidv4(); // Unique ID for this player
  #port: number; // Listening UDP port
  #listener?: (arg0: PlayerState) => Promise<void>; // Listener for _emitState()
  #socket?: UdpSocketRenderer;
  #seq = 0;
  #totalBytesReceived = 0;
  #closed: boolean = false; // Whether the player has been completely closed using close()
  #start: Time; // The time at which we started playing
  #packets: RawPacket[] = []; // Queue of packets that will form the next parsed message
  #parsedMessages: MessageEvent<unknown>[] = []; // Queue of messages that we'll send in next _emitState() call
  #metricsCollector: PlayerMetricsCollectorInterface;
  #presence: PlayerPresence = PlayerPresence.INITIALIZING;
  #emitTimer?: ReturnType<typeof setTimeout>;

  // track issues within the player
  #problems: PlayerProblem[] = [];
  #problemsById = new Map<string, PlayerProblem>();

  constructor({ port, metricsCollector }: VelodynePlayerOpts) {
    this.#port = port ?? DEFAULT_VELODYNE_PORT;
    log.info(`initializing VelodynePlayer on port ${this.#port}`);
    this.#metricsCollector = metricsCollector;
    this.#start = fromMillis(Date.now());
    this.#metricsCollector.playerConstructed();
    void this.#open();
  }

  #open = async (): Promise<void> => {
    if (this.#closed) {
      return;
    }
    this.#presence = PlayerPresence.INITIALIZING;

    if (this.#socket == undefined) {
      const net = await Sockets.Create();
      this.#socket = await net.createUdpSocket();
      this.#socket.on("error", (error) => {
        this._addProblem(PROBLEM_SOCKET_ERROR, {
          message: "Networking error listening for Velodyne data",
          severity: "error",
          error,
          tip: "Check that your are connected to the same local network (subnet) as the Velodyne sensor",
        });
      });
      this.#socket.on("message", this._handleMessage);
    } else {
      try {
        await this.#socket.close();
      } catch (err) {
        log.error(`Failed to close socket: ${err}`);
      }
    }

    try {
      await this.#socket.bind({ address: "0.0.0.0", port: this.#port });
      log.debug(`Bound Velodyne UDP listener socket to port ${this.#port}`);
    } catch (error) {
      this._addProblem(PROBLEM_SOCKET_ERROR, {
        message: "Could not bind to the Velodyne UDP data port",
        severity: "error",
        error,
        tip: `Check that port ${this.#port} is not in use by another application`,
      });
    }
  };

  _handleMessage = (data: Uint8Array, rinfo: UdpRemoteInfo): void => {
    const receiveTime = fromMillis(Date.now());
    const date = toDate(receiveTime);
    date.setMinutes(0, 0, 0);
    const topOfHour = fromDate(date);

    this.#totalBytesReceived += data.byteLength;
    this.#presence = PlayerPresence.PRESENT;
    this._clearProblem(PROBLEM_SOCKET_ERROR, { skipEmit: true });

    if (this.#seq === 0) {
      this.#metricsCollector.recordTimeToFirstMsgs();
    }

    const rawPacket = new RawPacket(data);

    const frequency = RPM / 60.0;
    const rate = packetRate(rawPacket.inferModel() ?? Model.HDL64E);
    const numPackets = Math.ceil(rate / frequency);

    this.#packets.push(rawPacket);
    if (this.#packets.length >= numPackets) {
      const message = {
        header: { seq: this.#seq++, stamp: receiveTime, frame_id: rinfo.address },
        packets: this.#packets.map((raw) => rawPacketToRos(raw, topOfHour)),
      };

      const msg: MessageEvent<unknown> = { topic: TOPIC, receiveTime, message };
      this.#parsedMessages.push(msg);
      this.#packets = [];

      this.#emitState();
    }
  };

  private _addProblem(
    id: string,
    problem: PlayerProblem,
    { skipEmit = false }: { skipEmit?: boolean } = {},
  ): void {
    this.#problemsById.set(id, problem);
    this.#problems = Array.from(this.#problemsById.values());
    if (!skipEmit) {
      this.#emitState();
    }
  }

  private _clearProblem(id: string, { skipEmit = false }: { skipEmit?: boolean } = {}): void {
    if (!this.#problemsById.delete(id)) {
      return;
    }
    this.#problems = Array.from(this.#problemsById.values());
    if (!skipEmit) {
      this.#emitState();
    }
  }

  // Potentially performance-sensitive; await can be expensive
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  #emitState = debouncePromise(() => {
    if (!this.#listener || this.#closed) {
      return Promise.resolve();
    }

    // Time is always moving forward even if we don't get messages from the device.
    // If we are not connected, don't emit updates since we are not longer getting new data
    if (this.#presence === PlayerPresence.PRESENT) {
      if (this.#emitTimer != undefined) {
        clearTimeout(this.#emitTimer);
      }
      this.#emitTimer = setTimeout(this.#emitState, 100);
    }

    const currentTime = fromMillis(Date.now());
    const messages = this.#parsedMessages;
    this.#parsedMessages = [];
    return this.#listener({
      name: "Velodyne",
      presence: this.#presence,
      progress: {},
      capabilities: CAPABILITIES,
      playerId: this.#id,
      problems: this.#problems,

      activeData: {
        messages,
        totalBytesReceived: this.#totalBytesReceived,
        messageOrder: "receiveTime",
        startTime: this.#start,
        endTime: currentTime,
        currentTime,
        isPlaying: true,
        speed: 1,
        // We don't support seeking, so we need to set this to any fixed value. Just avoid 0 so
        // that we don't accidentally hit falsy checks.
        lastSeekTime: 1,
        topics: TOPICS,
        datatypes: DATATYPES,
        publishedTopics: undefined,
        subscribedTopics: undefined,
        services: undefined,
        parameters: undefined,
        parsedMessageDefinitionsByTopic: {},
      },
    });
  });

  setListener(listener: (arg0: PlayerState) => Promise<void>): void {
    this.#listener = listener;
    this.#emitState();
  }

  close(): void {
    this.#closed = true;
    if (this.#socket) {
      void this.#socket.dispose();
      this.#socket = undefined;
    }
    if (this.#emitTimer != undefined) {
      clearTimeout(this.#emitTimer);
      this.#emitTimer = undefined;
    }
    this.#metricsCollector.close();
    this.#totalBytesReceived = 0;
    this.#seq = 0;
    this.#packets = [];
    this.#parsedMessages = [];
  }

  setSubscriptions(_subscriptions: SubscribePayload[]): void {}

  setPublishers(_publishers: AdvertiseOptions[]): void {
    // no-op
  }

  // Modify a remote parameter such as a rosparam.
  setParameter(_key: string, _value: ParameterValue): void {
    throw new Error(`Parameter modification is not supported for VelodynePlayer`);
  }

  publish(_request: PublishPayload): void {
    throw new Error(`Publishing is not supported for VelodynePlayer`);
  }

  startPlayback(): void {
    // no-op
  }

  pausePlayback(): void {
    // no-op
  }

  seekPlayback(_time: Time, _backfillDuration?: Time): void {
    // no-op
  }

  setPlaybackSpeed(_speedFraction: number): void {
    // no-op
  }

  requestBackfill(): void {
    // no-op
  }

  setGlobalVariables(_globalVariables: GlobalVariables): void {
    // no-op
  }
}

function rawPacketToRos(packet: RawPacket, topOfHour: Time): { stamp: Time; data: Uint8Array } {
  const microSecSinceTopOfHour = packet.gpsTimestamp;
  const stamp = addTimes(topOfHour, fromMicros(microSecSinceTopOfHour));
  return { stamp, data: packet.data };
}
