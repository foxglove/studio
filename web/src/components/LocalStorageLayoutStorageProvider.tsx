// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren, useState } from "react";

import Log from "@foxglove/log";
import {
  Layout,
  LayoutStorageContext,
  LayoutID,
  ILayoutStorage,
  migrateLayout,
} from "@foxglove/studio-base";

const log = Log.getLogger(__filename);

const KEY_PREFIX = "studio.layout-cache";

// FIXME: migration?
export default function LocalStorageLayoutStorageProvider(
  props: PropsWithChildren<unknown>,
): JSX.Element {
  const [ctx] = useState<ILayoutStorage>(() => {
    return {
      async list(namespace: string): Promise<readonly Layout[]> {
        const results: Layout[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(`${KEY_PREFIX}.${namespace}.`) === true) {
            const layout = localStorage.getItem(key);
            if (layout != undefined) {
              try {
                results.push(migrateLayout(JSON.parse(layout)));
              } catch (err) {
                log.error(err);
              }
            }
          }
        }
        return results;
      },

      async get(namespace: string, id: LayoutID): Promise<Layout | undefined> {
        const layout = localStorage.getItem(`${KEY_PREFIX}.${namespace}.${id}`);
        return layout == undefined ? undefined : migrateLayout(JSON.parse(layout));
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
