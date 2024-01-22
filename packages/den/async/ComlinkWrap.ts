// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

export function ComlinkWrap<T>(worker: Worker): { remote: Comlink.Remote<T>; dispose: () => void } {
  const remote = Comlink.wrap<T>(worker);

  const dispose = () => {
    remote[Comlink.releaseProxy]();
    worker.terminate();
  };
  return { remote, dispose };
}
