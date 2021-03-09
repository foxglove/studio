// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { URL } from "url";

import { XmlRpcCreateClient, XmlRpcClient, XmlRpcResponse } from "./IXmlRpc";

export default class RosMaster {
  private _client: XmlRpcClient;

  constructor(options: {
    xmlRpcCreateClient: XmlRpcCreateClient;
    uri?: URL;
    host?: string;
    port?: number;
    path?: string;
  }) {
    const host = options.host ?? options.uri?.hostname ?? "localhost";
    const port = options.port ?? Number(options.uri?.port ?? 11311);
    const path = options.path ?? options.uri?.pathname ?? "/";

    if (host.length === 0) {
      throw new Error("Invalid host");
    }
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error("Invalid port");
    }

    this._client = options.xmlRpcCreateClient({ host, port, path });
  }

  registerService(
    callerId: string,
    service: string,
    serviceApi: string,
    callerApi: string,
  ): Promise<XmlRpcResponse> {
    return this._client.methodCall("registerService", [callerId, service, serviceApi, callerApi]);
  }

  unregisterService(
    callerId: string,
    service: string,
    serviceApi: string,
  ): Promise<XmlRpcResponse> {
    return this._client.methodCall("unregisterService", [callerId, service, serviceApi]);
  }

  registerSubscriber(
    callerId: string,
    topic: string,
    topicType: string,
    callerApi: string,
  ): Promise<XmlRpcResponse> {
    return this._client.methodCall("registerSubscriber", [callerId, topic, topicType, callerApi]);
  }

  unregisterSubscriber(
    callerId: string,
    topic: string,
    callerApi: string,
  ): Promise<XmlRpcResponse> {
    return this._client.methodCall("unregisterSubscriber", [callerId, topic, callerApi]);
  }

  registerPublisher(
    callerId: string,
    topic: string,
    topicType: string,
    callerApi: string,
  ): Promise<XmlRpcResponse> {
    return this._client.methodCall("registerPublisher", [callerId, topic, topicType, callerApi]);
  }

  unregisterPublisher(callerId: string, topic: string, callerApi: string): Promise<XmlRpcResponse> {
    return this._client.methodCall("unregisterPublisher", [callerId, topic, callerApi]);
  }

  lookupNode(callerId: string, nodeName: string): Promise<XmlRpcResponse> {
    return this._client.methodCall("lookupNode", [callerId, nodeName]);
  }

  getPublishedTopics(callerId: string, subgraph: string = ""): Promise<XmlRpcResponse> {
    return this._client.methodCall("getPublishedTopics", [callerId, subgraph]);
  }

  getTopicTypes(callerId: string): Promise<XmlRpcResponse> {
    return this._client.methodCall("getTopicTypes", [callerId]);
  }

  getSystemState(callerId: string): Promise<XmlRpcResponse> {
    return this._client.methodCall("getSystemState", [callerId]);
  }

  getUri(callerId: string): Promise<XmlRpcResponse> {
    return this._client.methodCall("getUri", [callerId]);
  }

  lookupService(callerId: string, service: string): Promise<XmlRpcResponse> {
    return this._client.methodCall("lookupService", [callerId, service]);
  }
}
