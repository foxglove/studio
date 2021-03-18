// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Socket } from "net";

import { Cloneable, RpcCall } from "../shared/Rpc";
import { TcpServerElectron } from "./TcpServerElectron";
import { TcpSocketElectron } from "./TcpSocketElectron";
import { getTransform, nextId, registerEntity } from "./registry";

export { registerTransform } from "./registry";

// The original message channel connecting the renderer ("main world") to the
// preloader ("isolated world"). Function calls such as createSocket() and
// createServer() come in on this channel, and function call return values are
// sent back over it
let primaryChannel: MessageChannel | undefined;

// The API exposed over primaryChannel
const functionHandlers = new Map<string, (callId: number, args: Cloneable[]) => void>([
  [
    "createSocket",
    (callId, args) => {
      const transformName = args[0] as string | undefined;
      const port = createSocket(transformName);
      primaryChannel?.port2.postMessage(callId, [port]);
    },
  ],
  [
    "createServer",
    (callId, args) => {
      const transformName = args[0] as string | undefined;
      const port = createServer(transformName);
      primaryChannel?.port2.postMessage(callId, [port]);
    },
  ],
]);

export async function initElectronSocket(channel: string = "__electron_socket"): Promise<void> {
  const windowLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve(undefined);
      return;
    }
    window.onload = resolve;
  });

  await windowLoaded;

  primaryChannel = new MessageChannel();
  primaryChannel.port2.onmessage = (ev: MessageEvent<RpcCall>) => {
    const methodName = ev.data[0];
    const callId = ev.data[1];
    const handler = functionHandlers.get(methodName);
    if (handler == undefined) {
      primaryChannel?.port2.postMessage([callId, `unhandled method "${methodName}"`]);
      return;
    }

    const args = ev.data.slice(2) as Cloneable[];
    handler(callId, args);
  };
  primaryChannel.port2.start();

  window.postMessage(channel, "*", [primaryChannel.port1]);
}

export function createSocket(transformName?: string): MessagePort {
  const channel = new MessageChannel();
  const transform = transformName != undefined ? getTransform(transformName) : undefined;
  const id = nextId();
  const socket = new TcpSocketElectron(id, channel.port2, new Socket(), transform);
  registerEntity(id, socket);
  return channel.port1;
}

export function createServer(transformName?: string): MessagePort {
  const channel = new MessageChannel();
  const transform = transformName != undefined ? getTransform(transformName) : undefined;
  const id = nextId();
  const server = new TcpServerElectron(id, channel.port2, transform);
  registerEntity(id, server);
  return channel.port1;
}
