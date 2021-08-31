// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Logger from "@foxglove/log";
import { PanelsState } from "@foxglove/studio-base/";
import { filterMap } from "@foxglove/studio-base/../../den/collection";
import ConsoleApi, { ConsoleApiLayout } from "@foxglove/studio-base/services/ConsoleApi";
import { LayoutID, ISO8601Timestamp } from "@foxglove/studio-base/services/ILayoutStorage";
import {
  IRemoteLayoutStorage,
  RemoteLayout,
} from "@foxglove/studio-base/services/IRemoteLayoutStorage";

const log = Logger.getLogger(__filename);

function convertLayout({ id, name, permission, data }: ConsoleApiLayout): RemoteLayout {
  if (data == undefined) {
    throw new Error(`Missing data for server layout ${name} (${id})`);
  }
  return { id, name, permission, data: data as PanelsState };
}

export default class ConsoleApiRemoteLayoutStorage implements IRemoteLayoutStorage {
  constructor(private api: ConsoleApi) {}

  async getLayouts(): Promise<readonly RemoteLayout[]> {
    return filterMap(await this.api.getLayouts({ includeData: false }), (layout) => {
      try {
        return convertLayout(layout);
      } catch (err) {
        log.warn(err);
        return undefined;
      }
    });
  }
  async getLayout(id: LayoutID): Promise<RemoteLayout | undefined> {
    const layout = await this.api.getLayout(id, { includeData: true });
    return layout ? convertLayout(layout) : undefined;
  }

  async saveNewLayout({
    name,
    data,
    permission,
  }: {
    name: string;
    data: PanelsState;
    permission: "creator_write" | "org_read" | "org_write";
  }): Promise<RemoteLayout> {
    try {
      const result = await this.api.createLayout({ name, data, permission });
      return { status: "success", newMetadata: convertLayout(result) };
    } catch (err) {
      log.warn(err);
      return { status: "conflict" };
    }
  }

  async updateLayout({
    targetID,
    name,
    data,
    permission,
    ifUnmodifiedSince,
  }: {
    targetID: LayoutID;
    name?: string;
    data?: PanelsState;
    permission?: "creator_write" | "org_read" | "org_write";
    ifUnmodifiedSince: ISO8601Timestamp;
  }): Promise<
    | { status: "success"; newMetadata: RemoteLayoutMetadata }
    | { status: "not-found" }
    | { status: "conflict" }
    | { status: "precondition-failed" }
  > {
    try {
      const existingLayout = await this.api.getLayout(targetID, { includeData: false });
      if (!existingLayout) {
        return { status: "not-found" };
      }
      if (existingLayout.updated_at !== ifUnmodifiedSince) {
        return { status: "precondition-failed" };
      }
      const result = await this.api.updateLayout({
        id: targetID,
        name,
        data,
        permission,
      });
      return { status: "success", newMetadata: convertLayout(result) };
    } catch (err) {
      log.warn(err);
      return { status: "conflict" };
    }
  }

  async deleteLayout({
    targetID,
  }: {
    targetID: LayoutID;
    ifUnmodifiedSince: ISO8601Timestamp;
  }): Promise<{ status: "success" | "precondition-failed" }> {
    await this.api.deleteLayout(targetID);
    return { status: "success" };
  }
}
