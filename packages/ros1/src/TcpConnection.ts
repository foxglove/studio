// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TextEncoder } from "web-encoding";

import { Connection } from "./Connection";
import { TcpAddress, TcpSocket } from "./TcpTypes";

type Header = [string, string][];

export class TcpConnection implements Connection {
  _socket: TcpSocket;

  constructor(socket: TcpSocket) {
    this._socket = socket;

    socket.on("close", this._handleClose);
    socket.on("data", this._handleData);
  }

  transportType(): string {
    return "TCPROS";
  }

  remoteAddress(): TcpAddress | undefined {
    return this._socket.remoteAddress();
  }

  connected(): boolean {
    return this._socket.connected();
  }

  close(): void {
    this._socket.close();
  }

  async writeHeader(header: Header): Promise<void> {
    const data = TcpConnection.SerializeHeader(header);
    return this._socket.write(data);
  }

  // e.g. "TCPROS connection on port 59746 to [host:34318 on socket 11]"
  getTransportInfo(): string {
    const localPort = this._socket.localAddress()?.port ?? -1;
    const addr = this._socket.remoteAddress();
    const fd = this._socket.fd() ?? -1;
    if (addr) {
      const { address, port } = addr;
      return `TCPROS connection on port ${localPort} to [${address}:${port} on socket ${fd}]`;
    }
    return `TCPROS not connected [socket ${fd}]`;
  }

  private _handleClose = () => {
    // TODO: Enter a reconnect loop
  };

  private _handleData = (data: Uint8Array) => {
    // eslint-disable-next-line no-restricted-syntax
    console.log(`[RECEIVED] ${data}`);
  };

  static SerializeHeader(header: Header): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = header.map(([key, value]) => encoder.encode(`${key}=${value}`)) as Uint8Array[];
    const payloadLen = encoded.reduce((sum, str) => sum + str.length + 4, 0);
    const buffer = new ArrayBuffer(payloadLen + 4);
    const array = new Uint8Array(buffer);
    const view = new DataView(buffer);

    let idx = 0;
    view.setUint32(idx, payloadLen, true);
    idx += 4;

    encoded.forEach((strData) => {
      view.setUint32(idx, strData.length, true);
      idx += 4;
      array.set(strData, idx);
      idx += strData.length;
    });

    return new Uint8Array(buffer);
  }
}
