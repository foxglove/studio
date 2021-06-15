// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { defaultPlaybackConfig } from "@foxglove/studio-base/providers/CurrentLayoutProvider/reducers";
import { CachedLayout } from "@foxglove/studio-base/services/ILayoutCache";
import { ISO8601Timestamp, LayoutMetadata } from "@foxglove/studio-base/services/ILayoutStorage";
import { RemoteLayoutMetadata } from "@foxglove/studio-base/services/IRemoteLayoutStorage";
import MockLayoutCache from "@foxglove/studio-base/services/MockLayoutCache";
import MockRemoteLayoutStorage, {
  FAKE_USER,
} from "@foxglove/studio-base/services/MockRemoteLayoutStorage";
import OfflineLayoutStorage from "@foxglove/studio-base/services/OfflineLayoutStorage";
import { PanelConfig } from "@foxglove/studio-base/types/panels";

function makePanelsState(configById: Record<string, PanelConfig>): PanelsState {
  return {
    id: "dummy id",
    name: "dummy name",
    configById,
    globalVariables: {},
    linkedGlobalVariables: [],
    playbackConfig: defaultPlaybackConfig,
    userNodes: {},
    layout: "dummy layout",
  };
}

describe("OfflineLayoutStorage", () => {
  const originalDate = Date;
  const mockDateNow = jest.fn<number, []>().mockReturnValue(NaN);
  let mockDate: jest.SpyInstance<Date, [number]> | undefined;
  beforeEach(() => {
    mockDate = (
      jest.spyOn(global, "Date") as unknown as jest.SpyInstance<Date, [number]>
    ).mockImplementation(() => new originalDate(mockDateNow()));
  });
  afterEach(() => {
    mockDate?.mockRestore();
  });

  it("writes new layouts to cache, then uploads them", async () => {
    const cacheStorage = new MockLayoutCache();
    const remoteStorage = new MockRemoteLayoutStorage();
    const storage = new OfflineLayoutStorage({ cacheStorage, remoteStorage });

    await storage.saveNewLayout({
      path: ["a", "b"],
      name: "layout1",
      data: makePanelsState({}),
    });

    // The new layout is available from the cache immediately
    const expectedCached: LayoutMetadata = {
      id: expect.any(String),
      path: ["a", "b"],
      name: "layout1",
      creator: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      permission: "creator_write",
    };
    const cachedLayouts = await storage.getLayouts();
    expect(cachedLayouts).toEqual([expectedCached]);

    const expectedLocal: CachedLayout = {
      id: expect.any(String),
      path: ["a", "b"],
      name: "layout1",
      state: makePanelsState({}),
    };

    // The new layout has been written to cache storage and not remote storage
    await expect(cacheStorage.list()).resolves.toEqual([expectedLocal]);
    await expect(remoteStorage.getLayouts()).resolves.toEqual([]);

    mockDateNow.mockReturnValueOnce(10);
    await expect(storage.syncWithRemote()).resolves.toEqual([]);

    // After syncing, the layout is written to the remote storage
    const expectedRemote: RemoteLayoutMetadata = {
      id: expect.any(String),
      path: ["a", "b"],
      name: "layout1",
      creator: FAKE_USER,
      createdAt: new originalDate(10).toISOString() as ISO8601Timestamp,
      updatedAt: new originalDate(10).toISOString() as ISO8601Timestamp,
      permission: "creator_write",
    };
    const remoteLayouts = await remoteStorage.getLayouts();
    expect(remoteLayouts).toEqual([expectedRemote]);
    expectedRemote.id = remoteLayouts[0]!.id;

    await expect(remoteStorage.getLayout(expectedRemote.id)).resolves.toEqual({
      ...expectedRemote,
      data: expectedLocal.state,
    });

    // The new server metadata has been written to the cache
    await expect(cacheStorage.list()).resolves.toEqual([
      { ...expectedLocal, serverMetadata: expectedRemote },
    ]);
  });
});
