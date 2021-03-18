// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { OsContext } from "@foxglove-studio/app/OsContext";
import { AppConfiguration } from "@foxglove-studio/app/context/AppConfigurationContext";

export default class OsContextAppConfiguration implements AppConfiguration {
  static STORE_NAME = "settings";
  static STORE_KEY = "settings.json";

  readonly #ctx: OsContext;
  #currentPromise: Promise<unknown>;

  constructor(ctx: OsContext) {
    this.#ctx = ctx;
    this.#currentPromise = this.#ctx.storage
      .get(OsContextAppConfiguration.STORE_NAME, OsContextAppConfiguration.STORE_KEY, {
        encoding: "utf8",
      })
      .then((value) => JSON.parse(value ?? "{}"));
  }

  async get(key: string): Promise<unknown> {
    return ((await this.#currentPromise) as Record<string, unknown>)[key];
  }

  async set(key: string, value: unknown): Promise<void> {
    // Immediately set a new currentPromise so any future calls will wait for this one to complete.
    this.#currentPromise = this.#currentPromise.finally(async () => {
      const currentConfig = await this.#ctx.storage.get(
        OsContextAppConfiguration.STORE_NAME,
        OsContextAppConfiguration.STORE_KEY,
        { encoding: "utf8" },
      );

      const newConfig: unknown = { ...JSON.parse(currentConfig ?? "{}"), [key]: value };

      await this.#ctx.storage.put(
        OsContextAppConfiguration.STORE_NAME,
        OsContextAppConfiguration.STORE_KEY,
        JSON.stringify(newConfig),
      );
      return newConfig;
    });

    await this.#currentPromise;
  }
}
