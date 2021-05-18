// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { HttpHandler, HttpServer } from "@foxglove/xmlrpc";

export class MockHttpServer implements HttpServer {
  handler: HttpHandler = (_req) => Promise.resolve({ statusCode: 404 });

  private _listening = false;
  private _port?: number;
  private _hostname?: string;

  url(): string | undefined {
    if (!this._listening) {
      return undefined;
    }
    return `http://${this._hostname ?? "127.0.0.1"}:${this._port ?? 11311}/`;
  }

  port(): number | undefined {
    return this._port;
  }

  listen(port?: number, hostname?: string, _backlog?: number): Promise<void> {
    this._port = port;
    this._hostname = hostname;
    this._listening = true;
    return Promise.resolve();
  }

  close(): void {
    this._listening = false;
  }
}
