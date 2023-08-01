// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import Rpc from "@foxglove/studio-base/util/Rpc";
import { setupWorker } from "@foxglove/studio-base/util/RpcWorkerUtils";

import DataManager, { InitOpts } from "./DataManager";

type RpcEvent<EventType> = { id: string; event: EventType };

export default class DataMux {
  readonly #rpc: Rpc;
  readonly #managers = new Map<string, DataManager>();

  public constructor(rpc: Rpc) {
    this.#rpc = rpc;

    if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
      setupWorker(this.#rpc);
    }

    // create a new chartjs instance
    // this must be done before sending any other rpc requests to the instance
    rpc.receive("initialize", (args: InitOpts) => {
      const manager = new DataManager(args);
      this.#managers.set(args.id, manager);
    });

    rpc.receive("update", (args: RpcEvent<number>) => this.#getManager(args.id).update());

    rpc.receive("destroy", (args: RpcEvent<void>) => {
      const manager = this.#managers.get(args.id);
      if (manager) {
        manager.destroy();
        this.#managers.delete(args.id);
      }
    });
  }

  #getManager(id: string): DataManager {
    const manager = this.#managers.get(id);
    if (!manager) {
      throw new Error(`Could not find manager with id ${id}`);
    }
    return manager;
  }
}
