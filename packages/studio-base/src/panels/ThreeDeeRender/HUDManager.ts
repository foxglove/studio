// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type HUDItem = {
  /** Unique identifier for the item. Adding a message with the same id twice will result in a no-op */
  id: string;
  /** Designate what group this belongs to. Allows items to be cleared by group.
   * Would allow scene extensions to only clear their own items when applicable.
   */
  group: string;
  /** Function to return message content to show on HUD */
  getMessage: () => string;
  /** Display type */
  displayType: "empty" | "notice";
};

export class HUDItemManager {
  #HUDItemsById = new Map<string, HUDItem>();
  #onChange: () => void;
  public constructor(onChange: () => void) {
    this.#onChange = onChange;
  }

  public addHUDItem(item: HUDItem): void {
    if (!this.#HUDItemsById.has(item.id)) {
      this.#HUDItemsById.set(item.id, item);
      this.#onChange();
    }
  }

  public removeHUDItem(id: string): void {
    if (this.#HUDItemsById.delete(id)) {
      this.#onChange();
    }
  }

  public removeGroup(group: string): void {
    const items = this.getHUDItems();
    for (const item of items) {
      if (item.group === group) {
        this.removeHUDItem(item.id);
      }
    }
  }

  // eslint-disable-next-line @foxglove/no-boolean-parameters
  public displayIfTrue(value: boolean, hudItem: HUDItem): void {
    if (value) {
      this.addHUDItem(hudItem);
    } else {
      this.removeHUDItem(hudItem.id);
    }
  }

  public getHUDItems(): HUDItem[] {
    return Array.from(this.#HUDItemsById.values());
  }

  public clear(): void {
    this.#HUDItemsById.clear();
    this.#onChange();
  }
}
