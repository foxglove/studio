// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TcpConnection } from "./TcpConnection";
import { TcpAddress, TcpServer } from "./TcpTypes";

export class ConnectionManager {
  private _connectionIdCounter = 0;
  private _tcpServer?: TcpServer;
  private _tcpConnections: TcpConnection[] = [];

  constructor(options: { tcpServer?: TcpServer }) {
    this._tcpServer = options.tcpServer;
  }

  close(): void {
    this._tcpServer?.close();
    this._tcpConnections.forEach((conn) => conn.close());
    this._tcpConnections = [];
  }

  newConnectionId(): number {
    return this._connectionIdCounter++;
  }

  addTcpConnection(connection: TcpConnection): boolean {
    const idx = this._tcpConnections.indexOf(connection);
    if (idx > -1) {
      return false;
    }
    this._tcpConnections.push(connection);
    return true;
  }

  removeTcpConnection(connection: TcpConnection): boolean {
    const idx = this._tcpConnections.indexOf(connection);
    if (idx > -1) {
      this._tcpConnections.splice(idx, 1);
      return true;
    }
    return false;
  }

  tcpServerAddress(): TcpAddress | undefined {
    return this._tcpServer?.address();
  }
}
