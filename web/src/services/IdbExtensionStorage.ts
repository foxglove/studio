// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as IDB from "idb/with-async-ittr";

import Log from "@foxglove/log";
import { StoredExtension, IExtensionStorage, ExtensionInfo } from "@foxglove/studio-base";

const log = Log.getLogger(__filename);

const DATABASE_NAME = "foxglove-extensions";
const METADATA_STORE_NAME = "metadata";
const EXTENSION_STORE_NAME = "extensions";

interface ExtensionsDB extends IDB.DBSchema {
  metadata: {
    key: [namespace: string, id: string];
    value: {
      namespace: string;
      metadata: ExtensionInfo;
    };
    indexes: {
      namespace: string;
    };
  };
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
      log.debug("Creating extension metadata db", { storeName: METADATA_STORE_NAME });

      const metadataStore = db.createObjectStore(METADATA_STORE_NAME, {
        keyPath: ["namespace", "metadata.id"],
      });
      metadataStore.createIndex("namespace", "namespace");

      const extensionStoree = db.createObjectStore(EXTENSION_STORE_NAME, {
        keyPath: ["namespace", "extension.id"],
      });
      extensionStoree.createIndex("namespace", "namespace");
    },
  });

  async list(namespace: string): Promise<ExtensionInfo[]> {
    const records = await (
      await this.#db
    ).getAllFromIndex(METADATA_STORE_NAME, "namespace", namespace);

    log.debug("Listing extensions", { namespace, records });

    return records.map((record) => record.metadata);
  }

  async get(namespace: string, id: string): Promise<undefined | StoredExtension> {
    const record = await (await this.#db).get(EXTENSION_STORE_NAME, [namespace, id]);
    log.debug("Getting extension", { namespace, id, record });
    return record?.extension;
  }

  async put(namespace: string, extension: StoredExtension): Promise<StoredExtension> {
    log.debug("Storing extension", { namespace, extension });

    const transaction = (await this.#db).transaction(
      [METADATA_STORE_NAME, EXTENSION_STORE_NAME],
      "readwrite",
    );
    await Promise.all([
      transaction.db.put(METADATA_STORE_NAME, { namespace, metadata: extension.info }),
      transaction.db.put(EXTENSION_STORE_NAME, { namespace, extension }),
    ]);

    return extension;
  }

  async delete(namespace: string, id: string): Promise<void> {
    log.debug("Deleting extension", { namespace, id });

    const transaction = (await this.#db).transaction(
      [METADATA_STORE_NAME, EXTENSION_STORE_NAME],
      "readwrite",
    );
    await Promise.all([
      transaction.db.delete(METADATA_STORE_NAME, [namespace, id]),
      transaction.db.delete(EXTENSION_STORE_NAME, [namespace, id]),
    ]);
  }
}
