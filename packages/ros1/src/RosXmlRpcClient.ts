// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { XmlRpcClient, XmlRpcFault, XmlRpcStruct, XmlRpcValue } from "@foxglove/xmlrpc";

import { RosXmlRpcResponse, RosXmlRpcResponseOrFault } from "./XmlRpcTypes";

export class RosXmlRpcClient {
  private _client: XmlRpcClient;

  constructor(url: string) {
    this._client = new XmlRpcClient(url, { encoding: "utf8" });
  }

  url(): string {
    return this._client.url;
  }

  protected _methodCall = async (
    methodName: string,
    args: XmlRpcValue[],
  ): Promise<RosXmlRpcResponse> => {
    const res = await this._client.methodCall(methodName, args);
    if (!Array.isArray(res) || res.length !== 3) {
      throw new Error(`malformed XML-RPC response`);
    }

    const [code, msg] = res;
    if (typeof code !== "number" || typeof msg !== "string") {
      throw new Error(`invalid code/msg, code="${code}", msg="${msg}"`);
    }
    return res as RosXmlRpcResponse;
  };

  protected _multiMethodCall = async (
    requests: { methodName: string; params: XmlRpcValue[] }[],
  ): Promise<RosXmlRpcResponseOrFault[]> => {
    const res = await this._client.methodCall("system.multicall", [requests]);
    if (!Array.isArray(res) || res.length !== requests.length) {
      throw new Error(`malformed XML-RPC response`);
    }

    const output: RosXmlRpcResponseOrFault[] = [];

    const createFault = (fault: XmlRpcStruct) => {
      const faultString = typeof fault.faultString === "string" ? fault.faultString : undefined;
      const faultCode = typeof fault.faultCode === "number" ? fault.faultCode : undefined;
      return new XmlRpcFault(faultString, faultCode);
    };

    for (const entry of res) {
      if (!Array.isArray(entry) || entry.length !== 1) {
        output.push(createFault(entry as XmlRpcStruct));
      } else {
        const innerEntry = entry[0];
        if (!Array.isArray(innerEntry) || innerEntry.length !== 3) {
          throw new Error(`malformed XML-RPC multicall response`);
        }
        const [code, msg] = innerEntry;
        if (typeof code !== "number" || typeof msg !== "string") {
          throw new Error(`invalid code/msg, code="${code}", msg="${msg}"`);
        }
        output.push(innerEntry as RosXmlRpcResponse);
      }
    }

    return output;
  };
}
