// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TcpConnection } from "./TcpConnection";
import { TcpServer } from "./TcpTypes";

export class ConnectionManager {
  private _connectionIdCounter = 0;
  private _tcpServer?: TcpServer;
  private _tcpConnections = new Map<string, TcpConnection>();

  constructor(options: { tcpServer?: TcpServer }) {
    this._tcpServer = options.tcpServer;
  }

  close(): void {
    this._tcpServer?.close();

    for (const conn of this._tcpConnections.values()) {
      conn.close();
    }
    this._tcpConnections.clear();
  }

  newConnectionId(): number {
    return this._connectionIdCounter++;
  }

  addTcpConnection(connection: TcpConnection): boolean {
    const addr = connection.remoteAddress();
    if (addr === undefined) {
      return false;
    }

    const { address, port } = addr;
    const key = `${address}:${port}`;
    this._tcpConnections.set(key, connection);
    return true;
  }

  removeTcpConnection(address: string, port: number): boolean {
    const key = `${address}:${port}`;
    return this._tcpConnections.delete(key);
  }

  getTcpConnection(address: string, port: number): TcpConnection | undefined {
    const key = `${address}:${port}`;
    return this._tcpConnections.get(key);
  }
}
