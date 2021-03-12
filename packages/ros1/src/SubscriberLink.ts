// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Connection } from "./Connection";

export class SubscriberLink {
  readonly connectionId: number;
  destinationCallerId: string;
  connection: Connection;
  messagesSent = 0;
  bytesSent = 0;

  constructor(connectionId: number, destinationCallerId: string, connection: Connection) {
    this.connectionId = connectionId;
    this.destinationCallerId = destinationCallerId;
    this.connection = connection;
  }
}
