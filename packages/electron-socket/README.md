# @foxglove/electron-socket

Networking sockets for Electron apps

### Introduction

Raw sockets are not supported in browser contexts, even in Electron apps. To overcome this limitation, this package uses RPC between the Electron renderer context (referred to in this package as the "renderer" and in Electron documentation as "main world") and the preloader (referred to in Electron documentation as "isolated world" when running with `contextIsolation: true`) to expose TCP socket and server classes in the renderer context. The API somewhat resembles `net.Socket` and `net.Server` from node.js, with Promise-based methods since these classes are built on asynchronous RPC.

### Usage

```ts
// preload.ts ////////////////////////////////////////////////////////////////
import { initElectronSocket } from "@foxglove/electron-socket/electron";

initElectronSocket();
```

```ts
// renderer.ts ///////////////////////////////////////////////////////////////
import { initRendererSocket, createServer, createSocket } from "@foxglove/electron-socket/renderer";

async function main() {
  await initRendererSocket();

  const server = await createServer();
  server.on("connection", (client) => {
    client.write(new Uint8Array([42]));
  });
  server.listen(9000);

  const socket = await createSocket();
  socket.on("data", (data: Uint8Array) => console.log(`Server sent ${data}`));
  socket.connect({ port: 9000, host: "localhost" });
}

main();
```

### License

@foxglove/electron-socket is licensed under [Mozilla Public License, v2.0](https://opensource.org/licenses/MPL-2.0).
