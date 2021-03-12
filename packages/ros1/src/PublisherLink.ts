// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { URL } from "whatwg-url";

import { Connection } from "./Connection";
import { RosSlaveClient } from "./RosSlaveClient";

// Handles a connection to a single publisher on a given topic.
export class PublisherLink {
  connectionId = 0;
  rosSlaveClient: RosSlaveClient;
  connection: Connection;
  latched = false;
  header = new Map<string, string>();
  connected = false;
  messagesReceived = 0;
  bytesReceived = 0;
  dropEstimate = -1;

  constructor(rosSlaveClient: RosSlaveClient, connection: Connection) {
    this.rosSlaveClient = rosSlaveClient;
    this.connection = connection;
  }

  publisherXmlRpcUrl(): URL {
    return this.rosSlaveClient.url();
  }
}
