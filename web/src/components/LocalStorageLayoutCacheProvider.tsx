// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  Layout,
  LayoutStorageContext,
  ISO8601Timestamp,
  LayoutID,
  INamespacedLayoutStorage,
} from "@foxglove/studio-base";

const KEY_PREFIX = "studio.layout-cache";

export default function LocalStorageLayoutCacheProvider(
  props: PropsWithChildren<unknown>,
): JSX.Element {
  const [ctx] = useState<INamespacedLayoutStorage>(() => {
    return {
      async list(namespace: string): Promise<readonly Layout[]> {
        const results: Layout[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(`${KEY_PREFIX}.${namespace}.`) === true) {
            const layout = localStorage.getItem(key);
            if (layout != undefined) {
              results.push(JSON.parse(layout));
            }
          }
        }
        return results;
      },

      async create(
        namespace: string,
        layout: Pick<Layout, "name" | "data" | "permission" | "baselineId">,
      ): Promise<Layout> {
        const id = uuidv4() as LayoutID;
        const now = new Date().toISOString() as ISO8601Timestamp;
        const newLayout = { ...layout, id, createdAt: now, updatedAt: now };
        localStorage.setItem(`${KEY_PREFIX}.${namespace}.${id}`, JSON.stringify(newLayout));
        return newLayout;
      },

      async get(namespace: string, id: LayoutID): Promise<Layout | undefined> {
        const layout = localStorage.getItem(`${KEY_PREFIX}.${namespace}.${id}`);
        return layout == undefined ? undefined : JSON.parse(layout);
      },

      async put(namespace: string, layout: Layout): Promise<Layout> {
        localStorage.setItem(`${KEY_PREFIX}.${namespace}.${layout.id}`, JSON.stringify(layout));
        return layout;
      },

      async delete(namespace: string, id: LayoutID): Promise<void> {
        localStorage.removeItem(`${KEY_PREFIX}.${namespace}.${id}`);
      },
    };
  });

  return (
    <LayoutStorageContext.Provider value={ctx}>{props.children}</LayoutStorageContext.Provider>
  );
}
