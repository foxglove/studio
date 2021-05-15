// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { EventEmitter, ListenerFn } from "eventemitter3";

import { Client } from "./Client";
import { LoggerService } from "./LoggerService";
import { Publication } from "./Publication";
import { Publisher } from "./Publisher";
import { PublicationLookup, TcpClient } from "./TcpClient";
import { TcpAddress, TcpServer, TcpSocket } from "./TcpTypes";

export declare interface TcpPublisher {
  on(
    eventName: "connection",
    listener: (
      topic: string,
      connectionId: number,
      destinationCallerId: string,
      client: Client,
    ) => void,
  ): this;
  on(event: string, listener: ListenerFn): this;
}

// Implements a subscriber for the TCPROS transport. The actual TCP transport is
// implemented in the passed in `socket` (TcpSocket). A transform stream is used
// internally for parsing the TCPROS message format (4 byte length followed by
// message payload) so "message" events represent one full message each without
// the length prefix. A transform class that meets this requirements is
// implemented in `RosTcpMessageStream`.
export class TcpPublisher extends EventEmitter implements Publisher {
  private _server: TcpServer;
  private _nodeName: string;
  private _getConnectionId: () => number;
  private _getPublication: PublicationLookup;
  private _pendingClients = new Map<number, TcpClient>();
  private _shutdown = false;
  private _log?: LoggerService;

  constructor(
    server: TcpServer,
    nodeName: string,
    getConnectionId: () => number,
    getPublication: PublicationLookup,
    log?: LoggerService,
  ) {
    super();
    this._server = server;
    this._nodeName = nodeName;
    this._getConnectionId = getConnectionId;
    this._getPublication = getPublication;
    this._log = log;

    server.on("connection", this._handleConnection);
    server.on("close", this._handleClose);
    server.on("error", this._handleError);
  }

  address(): TcpAddress | undefined {
    return this._server.address();
  }

  publish(publication: Publication, message: unknown): Promise<void> {
    const msgSize = publication.messageWriter.calculateBufferSize(message);
    const dataSize = 4 + msgSize;
    const buffer = new ArrayBuffer(dataSize);

    // Write the 4-byte size integer
    new DataView(buffer, 0, 4).setUint32(0, msgSize, true);

    // Write the serialized message data
    const msgData = new Uint8Array(buffer, 4, dataSize - 4);
    publication.messageWriter.writeMessage(message, msgData as Buffer);

    const data = new Uint8Array(buffer, 0, dataSize);
    return publication.write(this.transportType(), data);
  }

  transportType(): string {
    return "TCPROS";
  }

  listening(): boolean {
    return !this._shutdown;
  }

  close(): void {
    this._log?.debug?.(`stopping tcp publisher`);

    this._shutdown = true;
    this.removeAllListeners();
    this._server.close();

    for (const client of this._pendingClients.values()) {
      client.removeAllListeners();
      client.close();
    }
    this._pendingClients.clear();
  }

  // TcpServer handlers ////////////////////////////////////////////////////////

  private _handleConnection = async (socket: TcpSocket): Promise<void> => {
    if (this._shutdown) {
      socket.close().catch(() => {});
      return;
    }

    const addr = await socketRemoteAddress(socket);
    if (addr == undefined) {
      this._log?.warn?.(`Cannot resolve remote address for incoming tcp connection`);
      return socket.close().catch(() => {});
    }

    const connectionId = this._getConnectionId();
    const client = new TcpClient(
      socket,
      addr.address,
      addr.port,
      this._nodeName,
      this._getPublication,
      this._log,
    );
    this._pendingClients.set(connectionId, client);

    client.on("subscribe", (topic, destinationCallerId) => {
      this._pendingClients.delete(connectionId);
      this.emit("connection", topic, connectionId, destinationCallerId, client);
    });
  };

  private _handleClose = (): void => {
    if (!this._shutdown) {
      this._log?.warn?.(`tcp server closed unexpectedly. shutting down tcp publisher`);
      this._shutdown = true;
    }
  };

  private _handleError = (err: Error): void => {
    if (!this._shutdown) {
      this._log?.warn?.(`tcp publisher error: ${err}`);
    }
  };
}

async function socketRemoteAddress(socket: TcpSocket): Promise<TcpAddress | undefined> {
  try {
    return await socket.remoteAddress();
  } catch {
    return undefined;
  }
}
