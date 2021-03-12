// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SubscriberLink } from "./SubscriberLink";

// [connectionId, bytesSent, messageDataSent, messagesSent, connected]
type SubscriberStats = [number, number, number, number, 0];

// [connectionId, destinationCallerId, direction, transport, topicName, connected, connectionInfo]
// e.g. [2, "/listener", "o", "TCPROS", "/chatter", true, "TCPROS connection on port 55878 to [127.0.0.1:44273 on socket 7]"]
type SubscriberInfo = [number, string, "o", string, string, number, string];

export class Publication {
  readonly name: string;
  subscribers: SubscriberLink[] = [];

  constructor(name: string) {
    this.name = name;
  }

  getInfo(): SubscriberInfo[] {
    return this.subscribers.map(
      (sub): SubscriberInfo => {
        return [
          sub.connectionId,
          sub.destinationCallerId,
          "o",
          sub.connection.transportType(),
          this.name,
          1,
          sub.connection.getTransportInfo(),
        ];
      },
    );
  }

  getStats(): [string, SubscriberStats[]] {
    const subStats = this.subscribers.map(
      (sub): SubscriberStats => {
        return [sub.connectionId, sub.bytesSent, sub.bytesSent, sub.messagesSent, 0];
      },
    );
    return [this.name, subStats];
  }
}
