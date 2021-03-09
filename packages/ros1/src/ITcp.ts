// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type TcpAddress = {
  port: number;
  family: "IPv4" | "IPv6";
  address: string;
};

export interface TcpSocket {
  address(): TcpAddress | undefined;
  localAddress(): TcpAddress | undefined;
  close(): void;

  on(event: "close", listener: () => void): this;
  on(event: "data", listener: (data: Uint8Array) => void): this;
  on(event: "end", listener: () => void): this;
  on(event: "timeout", listener: () => void): this;
  on(event: "error", listener: (err: Error) => void): this;
}

export interface TcpServer {
  address(): TcpAddress | undefined;
  close(): void;

  on(event: "close", listener: () => void): this;
  on(event: "connection", listener: (socket: TcpSocket) => void): this;
  on(event: "error", listener: (err: Error) => void): this;
}

export interface TcpListen {
  (options: { host?: string; port?: number; backlog?: number }): Promise<TcpServer>;
}

export interface TcpConnect {
  (options: { host: string; port: number }): Promise<TcpSocket>;
}
