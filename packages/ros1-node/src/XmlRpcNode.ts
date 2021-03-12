// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import EventEmitter from "eventemitter3";
import { URL } from "whatwg-url";
import { default as xmlrpc } from "xmlrpc-rosnodejs";

import type {
  XmlRpcClient,
  XmlRpcValue,
  XmlRpcResponse,
  XmlRpcServer,
  HttpAddress,
} from "@foxglove/ros1";

export class XmlRpcClientNode implements XmlRpcClient {
  readonly serverUrl: URL;

  private _client: xmlrpc.Client;

  constructor(serverUrl: URL) {
    this.serverUrl = serverUrl;
    this._client = xmlrpc.createClient({ url: serverUrl.toString() });
  }

  methodCall(method: string, args: XmlRpcValue[]): Promise<XmlRpcResponse> {
    return new Promise((resolve, reject) => {
      this._client.methodCall(method, args, (error: Error | undefined, value: XmlRpcResponse) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(value);
      });
    });
  }
}

export class XmlRpcServerNode extends EventEmitter implements XmlRpcServer {
  private _server: xmlrpc.Server;
  private _address?: HttpAddress;

  constructor(server: xmlrpc.Server, address: HttpAddress) {
    super();
    this._server = server;
    this._address = address;
  }

  address(): HttpAddress | undefined {
    return this._address;
  }

  close(): void {
    this._server.httpServer.close();
    this._address = undefined;
  }

  addMethod(method: string, handler: (args: XmlRpcValue[]) => Promise<XmlRpcResponse>): this {
    this._server.on(method, (err, params, callback) => {
      if (err) {
        callback(err, undefined);
        return;
      }

      if (!Array.isArray(params)) {
        params = [params];
      }

      handler(params)
        .then((value) => {
          callback(undefined, value);
        })
        .catch((error) => {
          callback(error, undefined);
        });
    });
    return this;
  }
}

export function XmlRpcCreateClient(options: { url: URL }): Promise<XmlRpcClient> {
  return Promise.resolve(new XmlRpcClientNode(options.url));
}

export function XmlRpcCreateServer(options: {
  hostname: string;
  port?: number;
}): Promise<XmlRpcServer> {
  return new Promise((resolve, reject) => {
    const server = xmlrpc.createServer(options, () => {
      const address = server.httpServer.address();
      if (address !== null && typeof address !== "string") {
        resolve(
          new XmlRpcServerNode(server, {
            hostname: options.hostname,
            port: address.port,
            secure: false,
          }),
        );
      } else {
        reject(
          new Error(`Failed to create an XMLRPC server at ${options.hostname}:${options.port}`),
        );
      }
    });
  });
}
