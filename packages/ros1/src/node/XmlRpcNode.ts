// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { default as xmlrpc } from "xmlrpc-rosnodejs";

import type { XmlRpcClient, XmlRpcValue, XmlRpcResponse } from "../IXmlRpc";

export class XmlRpcClientNode implements XmlRpcClient {
  private _client: xmlrpc.Client;

  constructor(options: { host: string; port: number; path: string }) {
    this._client = xmlrpc.createClient(options);
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

export function XmlRpcCreateClientNode(options: {
  host: string;
  port: number;
  path: string;
}): XmlRpcClient {
  return new XmlRpcClientNode(options);
}
