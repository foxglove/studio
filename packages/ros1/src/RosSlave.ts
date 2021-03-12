// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { URL } from "whatwg-url";

import { RosNode } from "./RosNode";
import { XmlRpcResponse, XmlRpcServer, XmlRpcValue } from "./XmlRpcTypes";

function CheckArguments(args: XmlRpcValue[], expected: string[]): Error | undefined {
  if (args.length !== expected.length) {
    return new Error(`Expected ${expected.length} arguments, got ${args.length}`);
  }

  for (let i = 0; i < args.length; i++) {
    if (expected[i] !== "*" && typeof args[i] !== expected[i]) {
      return new Error(`Expected "${expected[i]}" for arg ${i}, got "${typeof args[i]}"`);
    }
  }

  return undefined;
}

function TcpRequested(protocols: XmlRpcValue[]): boolean {
  for (const proto of protocols) {
    if (Array.isArray(proto) && proto.length > 0) {
      if (proto[0] === "TCPROS") {
        return true;
      }
    }
  }
  return false;
}

export class RosSlave {
  private _server?: XmlRpcServer;
  private _rosNode: RosNode;

  constructor(rosNode: RosNode) {
    this._rosNode = rosNode;
  }

  async start(port?: number): Promise<void> {
    const hostname = await this._rosNode.hostname();
    this._server = await this._rosNode.xmlRpcCreateServer({ hostname, port });

    this._server.addMethod("getBusStats", this.getBusStats);
    this._server.addMethod("getBusInfo", this.getBusInfo);
    this._server.addMethod("shutdown", this.shutdown);
    this._server.addMethod("getPid", this.getPid);
    this._server.addMethod("getSubscriptions", this.getSubscriptions);
    this._server.addMethod("getPublications", this.getPublications);
    this._server.addMethod("paramUpdate", this.paramUpdate);
    this._server.addMethod("publisherUpdate", this.publisherUpdate);
    this._server.addMethod("requestTopic", this.requestTopic);
  }

  close(): void {
    this._server?.close();
    this._server = undefined;
  }

  url(): URL | undefined {
    const addr = this._server?.address();
    if (addr === undefined) {
      return undefined;
    }
    return new URL(`${addr.secure ? "https:" : "http:"}//${addr.hostname}:${addr.port}/`);
  }

  getBusStats = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string"]);
    if (err) {
      return Promise.reject(err);
    }

    const publications = this._rosNode.publications.values();
    const subscriptions = this._rosNode.subscriptions.values();

    const publishStats: XmlRpcValue[] = Array.from(publications, (pub, _) => pub.getStats());
    const subscribeStats: XmlRpcValue[] = Array.from(subscriptions, (sub, _) => sub.getStats());
    const serviceStats: XmlRpcValue[] = [];

    return Promise.resolve([1, "test", [publishStats, subscribeStats, serviceStats]]);
  };

  getBusInfo = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string"]);
    if (err) {
      return Promise.reject(err);
    }

    return Promise.resolve([1, "", ""]);
  };

  shutdown = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    if (args.length !== 1 && args.length !== 2) {
      return Promise.reject(new Error(`Expected 1-2 arguments, got ${args.length}`));
    }

    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] !== "string") {
        return Promise.reject(new Error(`Expected "string" for arg ${i}, got "${typeof args[i]}"`));
      }
    }

    const msg = args[1] as string | undefined;
    this._rosNode.shutdown(msg);

    return Promise.resolve([1, "", 0]);
  };

  getPid = async (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string"]);
    if (err) {
      return Promise.reject(err);
    }

    const pid = await this._rosNode.pid();
    return [1, "", pid];
  };

  getSubscriptions = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string"]);
    if (err) {
      return Promise.reject(err);
    }

    const subs: [string, string][] = [];
    this._rosNode.subscriptions.forEach((sub) => subs.push([sub.name, sub.dataType]));
    return Promise.resolve([1, "subscriptions", subs]);
  };

  getPublications = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string"]);
    if (err) {
      return Promise.reject(err);
    }

    const pubs: [string, string][] = [];
    this._rosNode.publications.forEach((pub) => pubs.push([pub.name, pub.dataType]));
    return Promise.resolve([1, "publications", pubs]);
  };

  paramUpdate = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string", "string", "*"]);
    if (err) {
      return Promise.reject(err);
    }

    // TODO
    return Promise.reject(new Error("Not implemented"));
  };

  publisherUpdate = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string", "string", "*"]);
    if (err) {
      return Promise.reject(err);
    }

    // TODO
    return Promise.reject(new Error("Not implemented"));
  };

  requestTopic = (args: XmlRpcValue[]): Promise<XmlRpcResponse> => {
    const err = CheckArguments(args, ["string", "string", "*"]);
    if (err) {
      return Promise.reject(err);
    }

    // const topic = args[1] as string;
    const protocols = args[2];
    if (!Array.isArray(protocols) || !TcpRequested(protocols)) {
      return Promise.resolve([0, "unsupported protocol", []]);
    }

    const addr = this._rosNode.connectionManager.tcpServerAddress();
    if (!addr) {
      return Promise.resolve([0, "cannot receive incoming connections", []]);
    }

    const tcp = ["TCPROS", addr.address, addr.port];
    return Promise.resolve([1, "", tcp]);
  };
}
