// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Cloneable, RpcCall, RpcResponse } from "../shared/Rpc";
import { TcpServerRenderer } from "./TcpServerRenderer";
import { TcpSocketRenderer } from "./TcpSocketRenderer";

// The renderer ("main world") side of the original message channel connecting
// the renderer to the preloader ("isolated world"). Function calls such as
// createSocket() and createServer() are sent over this port, and function call
// return values are received back over it
let primaryPort: MessagePort | undefined;
// The promise while we are waiting for primaryPort to be received
let primaryPromise: Promise<void> | undefined;
// Asynchronous RPC calls are tracked using a callId integer
let nextCallId = 0;
// Completion callbacks for any in-flight RPC calls
const callbacks = new Map<number, (args: Cloneable[], ports?: readonly MessagePort[]) => void>();

// Initialize electron-socket on the renderer side. This method should be called
// before the window is loaded
export async function initRendererSocket(channel: string = "__electron_socket"): Promise<void> {
  if (primaryPort) {
    return Promise.resolve();
  } else if (primaryPromise) {
    return primaryPromise;
  }

  primaryPromise = new Promise((resolve) => {
    const messageListener = (windowEv: MessageEvent<string>) => {
      if (windowEv.target !== window || windowEv.data !== channel) {
        return;
      }

      primaryPort = windowEv.ports[0];
      primaryPromise = undefined;

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
      }

      window.removeEventListener("message", messageListener);
      resolve();
    };
    window.addEventListener("message", messageListener);
  });

  return primaryPromise;
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
