// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageReader, parseMessageDefinition, RosMsgDefinition } from "rosbag";
import { TextDecoder, TextEncoder } from "web-encoding";

import { Connection } from "./Connection";
import { TcpAddress, TcpSocket } from "./TcpTypes";

type Header = [string, string][];

export class TcpConnection implements Connection {
  _socket: TcpSocket;
  _readingHeader = true;
  _md5sum: string | undefined;
  _msgDefinition: RosMsgDefinition[] = [];
  _msgReader: MessageReader | undefined;
  _latching = false;

  constructor(socket: TcpSocket) {
    this._socket = socket;

    socket.on("close", this._handleClose);
    socket.on("message", this._handleMessage);
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

  private _handleMessage = (data: Uint8Array) => {
    if (this._readingHeader) {
      this._readingHeader = false;

      const header = TcpConnection.ParseHeader(data);

      this._md5sum = header.get("md5sum");
      this._latching = header.get("latching") === "1";
      this._msgDefinition = parseMessageDefinition(header.get("message_definition") ?? "");
      this._msgReader = new MessageReader(this._msgDefinition);

      // eslint-disable-next-line no-restricted-syntax
      console.dir(header);
    } else {
      if (this._msgReader) {
        const msg = this._msgReader.readMessage(
          Buffer.from(data.buffer, data.byteOffset, data.length),
        );
        // eslint-disable-next-line no-restricted-syntax
        console.log(`[MSG] ${JSON.stringify(msg)}`);
      }
    }
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

  static ParseHeader(data: Uint8Array): Map<string, string> {
    const decoder = new TextDecoder();
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const result = new Map<string, string>();

    let idx = 0;
    while (idx + 4 < data.length) {
      const len = Math.min(view.getUint32(idx, true), data.length - idx - 4);
      idx += 4;
      const str = decoder.decode(new Uint8Array(data.buffer, data.byteOffset + idx, len)) as string;
      let equalIdx = str.indexOf("=");
      if (equalIdx < 0) {
        equalIdx = str.length;
      }
      const key = str.substr(0, equalIdx);
      const value = str.substr(equalIdx + 1);
      result.set(key, value);
      idx += len;
    }

    return result;
  }
}
