// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Cloneable, RpcCall, RpcResponse } from "../shared/Rpc";
import { TcpServerRenderer } from "./TcpServerRenderer";
import { TcpSocketRenderer } from "./TcpSocketRenderer";

let primaryPort: MessagePort | undefined;
const callbacks = new Map<number, (args: Cloneable[], ports?: readonly MessagePort[]) => void>();
let nextCallId = 0;

export function initRendererSocket(channel: string = "__electron_socket"): void {
  window.onmessage = (windowEv: MessageEvent<string>) => {
    if (windowEv.target !== window || windowEv.data !== channel) {
      return;
    }
    primaryPort = windowEv.ports[0];

    if (primaryPort) {
      primaryPort.onmessage = (ev: MessageEvent<RpcResponse>) => {
        const callId = ev.data[0];
        const args = ev.data.slice(1);
        const callback = callbacks.get(callId);
        if (callback) {
          callbacks.delete(callId);
          callback(args, ev.ports);
        }
      };

      // eslint-disable-next-line no-restricted-syntax
      console.log(`Registered primary renderer port ${primaryPort}`);
    }
  };
}

export function createSocket(transformName?: string): Promise<TcpSocketRenderer> {
  return new Promise((resolve, reject) => {
    if (primaryPort == undefined) {
      return reject("not connected");
    }

    const callId = nextCallId++;
    callbacks.set(callId, (_, ports) => {
      const port = ports?.[0];
      if (!port) {
        return reject(new Error("no port returned"));
      }

      resolve(new TcpSocketRenderer(port));
    });

    const msg: RpcCall = ["createSocket", callId, transformName];
    primaryPort.postMessage(msg);
  });
}

export async function createServer(transformName?: string): Promise<TcpServerRenderer> {
  return new Promise((resolve, reject) => {
    if (primaryPort == undefined) {
      return reject("not connected");
    }

    const callId = nextCallId++;
    callbacks.set(callId, (_, ports) => {
      const port = ports?.[0];
      if (!port) {
        return reject(new Error("no port returned"));
      }

      resolve(new TcpServerRenderer(port));
    });

    const msg: RpcCall = ["createServer", callId, transformName];
    primaryPort.postMessage(msg);
  });
}
