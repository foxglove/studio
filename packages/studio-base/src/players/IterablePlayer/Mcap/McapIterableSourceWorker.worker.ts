// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

import { IterableSourceInitializeArgs } from "@foxglove/studio-base/players/IterablePlayer/IIterableSource";
import { WorkerBufferedIterableSourceWorker } from "@foxglove/studio-base/players/IterablePlayer/WorkerBufferedIterableSourceWorker";

import { McapIterableSource } from "./McapIterableSource";

export function initialize(args: IterableSourceInitializeArgs): WorkerBufferedIterableSourceWorker {
  if (args.file) {
    const source = new McapIterableSource({ type: "file", file: args.file });
    const wrapped = new WorkerBufferedIterableSourceWorker(source);
    return Comlink.proxy(wrapped);
  } else if (args.url) {
    const source = new McapIterableSource({ type: "url", url: args.url });
    const wrapped = new WorkerBufferedIterableSourceWorker(source);
    return Comlink.proxy(wrapped);
  }

  throw new Error("file or url required");
}

Comlink.expose(initialize);
