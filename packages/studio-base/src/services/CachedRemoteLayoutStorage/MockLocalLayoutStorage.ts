// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { LocalLayout, LocalLayoutStorage } from "@foxglove/studio-base/services/LocalLayoutStorage";

export default class MockLocalLayoutStorage implements LocalLayoutStorage {
  private layoutsById: Map<string, LocalLayout>;

  constructor(layouts: LocalLayout[] = []) {
    this.layoutsById = new Map(layouts.map((layout) => [layout.id, layout]));
  }

  async list(): Promise<readonly LocalLayout[]> {
    return Array.from(this.layoutsById.values());
  }

  async get(id: string): Promise<LocalLayout | undefined> {
    return this.layoutsById.get(id);
  }

  async put(layout: LocalLayout): Promise<void> {
    this.layoutsById.set(layout.id, layout);
  }

  async delete(id: string): Promise<void> {
    this.layoutsById.delete(id);
  }
}
