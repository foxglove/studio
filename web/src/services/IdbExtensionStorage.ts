// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as IDB from "idb/with-async-ittr";

import Log from "@foxglove/log";
import { StoredExtension, IExtensionStorage } from "@foxglove/studio-base";

const log = Log.getLogger(__filename);

const DATABASE_NAME = "foxglove-extensions";
const OBJECT_STORE_NAME = "extensions";

interface ExtensionsDB extends IDB.DBSchema {
  extensions: {
    key: [namespace: string, id: string];
    value: {
      namespace: string;
      extension: StoredExtension;
    };
    indexes: {
      namespace: string;
    };
  };
}

export class IdbExtensionStorage implements IExtensionStorage {
  #db = IDB.openDB<ExtensionsDB>(DATABASE_NAME, 1, {
    upgrade(db) {
      log.debug("Creating extension db", { storeName: OBJECT_STORE_NAME });
      const store = db.createObjectStore(OBJECT_STORE_NAME, {
        keyPath: ["namespace", "extension.id"],
      });
      store.createIndex("namespace", "namespace");
    },
  });

  async list(namespace: string): Promise<StoredExtension[]> {
    const records = await (
      await this.#db
    ).getAllFromIndex(OBJECT_STORE_NAME, "namespace", namespace);

    log.debug("Listing extensions", { namespace, count: records.length });
    return records.map((record) => record.extension);
  }

  async get(namespace: string, id: string): Promise<undefined | StoredExtension> {
    const record = await (await this.#db).get(OBJECT_STORE_NAME, [namespace, id]);
    log.debug("Getting extension", { namespace, id, record });
    return record?.extension;
  }

  async put(namespace: string, extension: StoredExtension): Promise<StoredExtension> {
    log.debug("Storing extension", { namespace, extension });
    await (await this.#db).put(OBJECT_STORE_NAME, { namespace, extension });
    return extension;
  }

  async delete(namespace: string, id: string): Promise<void> {
    log.debug("Deleting extension", { namespace, id });
    await (await this.#db).delete(OBJECT_STORE_NAME, [namespace, id]);
  }
}
