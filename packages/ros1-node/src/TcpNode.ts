// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TcpAddress, TcpServer, TcpSocket } from "@foxglove/ros1";
import EventEmitter from "eventemitter3";
import * as net from "net";

type MaybeHasFd = {
  _handle:
    | {
        fd: number | undefined;
      }
    | undefined;
};

export class TcpSocketNode extends EventEmitter implements TcpSocket {
  private _socket: net.Socket;

  constructor(socket: net.Socket) {
    super();
    this._socket = socket;

    socket.on("close", () => this.emit("close"));
    socket.on("data", (data) => this.emit("data", new Uint8Array(data.buffer)));
    socket.on("end", () => this.emit("end"));
    socket.on("timeout", () => this.emit("timeout"));
    socket.on("error", (err) => this.emit("error", err));
  }

  remoteAddress(): TcpAddress | undefined {
    if (this._socket.destroyed) {
      return undefined;
    }

    const port = this._socket.remotePort;
    const family = this._socket.remoteFamily;
    const address = this._socket.remoteAddress;
    return port !== undefined && family !== undefined && address !== undefined
      ? { port, family, address }
      : undefined;
  }

  localAddress(): TcpAddress | undefined {
    if (this._socket.destroyed) {
      return undefined;
    }
    const port = this._socket.localPort;
    const family = this._socket.remoteFamily; // There is no localFamily
    const address = this._socket.localAddress;
    return port !== undefined && family !== undefined && address !== undefined
      ? { port, family, address }
      : undefined;
  }

  fd(): number | undefined {
    // eslint-disable-next-line no-underscore-dangle
    return ((this._socket as unknown) as MaybeHasFd)._handle?.fd;
  }

  connected(): boolean {
    return !this._socket.destroyed && this._socket.remoteAddress !== undefined;
  }

  close(): void {
    this._socket.destroy();
  }

  write(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      this._socket.write(data, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

export class TcpServerNode extends EventEmitter implements TcpServer {
  private _server: net.Server;

  constructor(server: net.Server) {
    super();
    this._server = server;

    server.on("close", () => this.emit("close"));
    server.on("connection", (socket) => this.emit("connection", new TcpSocketNode(socket)));
    server.on("error", (err) => this.emit("error", err));
  }

  address(): TcpAddress | undefined {
    const addr = this._server.address();
    if (addr === null || typeof addr === "string") {
      // Address will only be a string for an IPC (named pipe) server, which
      // should never happen in TcpServerNode
      return undefined;
    }
    return addr;
  }

  close(): void {
    this._server.close();
  }
}

export function TcpListen(options: {
  host?: string;
  port?: number;
  backlog?: number;
}): Promise<TcpServerNode> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(options.port, options.host, options.backlog, () => {
      server.removeListener("error", reject);
      resolve(new TcpServerNode(server));
    });
  });
}

export function TcpConnect(options: { host: string; port: number }): Promise<TcpSocket> {
  return new Promise((resolve, reject) => {
    const TIMEOUT_MS = 5000;
    const KEEPALIVE_MS = 60 * 1000;

    const socket: net.Socket = net
      .createConnection(
        {
          timeout: TIMEOUT_MS,
          port: options.port,
          host: options.host,
        },
        () => {
          socket.removeListener("error", reject);
          socket.setKeepAlive(true, KEEPALIVE_MS);
          resolve(new TcpSocketNode(socket));
        },
      )
      .on("error", reject);
  });
}
