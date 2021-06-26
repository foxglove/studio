/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { act } from "@testing-library/react";
import { mount } from "enzyme";
import { ToastProvider } from "react-toast-notifications";

import {
  CurrentLayoutActions,
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import LayoutCacheContext from "@foxglove/studio-base/context/LayoutCacheContext";
import { UserProfileStorageContext } from "@foxglove/studio-base/context/UserProfileStorageContext";
import welcomeLayout from "@foxglove/studio-base/layouts/welcomeLayout";
import CacheOnlyLayoutStorageProvider from "@foxglove/studio-base/providers/CacheOnlyLayoutStorageProvider";
import CurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider";
import { CachedLayout } from "@foxglove/studio-base/services/ILayoutCache";
import { LayoutID } from "@foxglove/studio-base/services/ILayoutStorage";
import Storage from "@foxglove/studio-base/util/Storage";
import delay from "@foxglove/studio-base/util/delay";
import signal from "@foxglove/studio-base/util/signal";

const TEST_LAYOUT: PanelsState = {
  layout: "ExamplePanel!1",
  configById: {},
  globalVariables: {},
  userNodes: {},
  linkedGlobalVariables: [],
  playbackConfig: {
    speed: 0.2,
    messageOrder: "receiveTime",
    timeDisplayMethod: "ROS",
  },
};

function mockThrow(name: string) {
  return () => {
    throw new Error(`Unexpected mock function call ${name}`);
  };
}

function makeMockLayoutStorage() {
  return {
    list: jest.fn().mockImplementation(mockThrow("list")),
    get: jest.fn().mockImplementation(mockThrow("get")),
    put: jest.fn().mockImplementation(mockThrow("put")),
    delete: jest.fn().mockImplementation(mockThrow("delete")),
  };
}
function makeMockUserProfile() {
  return {
    getUserProfile: jest.fn().mockImplementation(mockThrow("getUserProfile")),
    setUserProfile: jest.fn().mockImplementation(mockThrow("setUserProfile")),
  };
}

function renderTest({
  mockLayoutStorage,
  mockUserProfile,
}: {
  mockLayoutStorage: ReturnType<typeof makeMockLayoutStorage>;
  mockUserProfile: ReturnType<typeof makeMockUserProfile>;
}) {
  const childMounted = signal();
  const currentLayoutStates: (PanelsState | undefined)[] = [];
  const actions: { current?: CurrentLayoutActions } = {};
  function Child() {
    childMounted.resolve();
    currentLayoutStates.push(useCurrentLayoutSelector((state) => state.selectedLayout?.data));
    actions.current = useCurrentLayoutActions();
    return ReactNull;
  }
  mount(
    <ToastProvider>
      <LayoutCacheContext.Provider value={mockLayoutStorage}>
        <CacheOnlyLayoutStorageProvider>
          <UserProfileStorageContext.Provider value={mockUserProfile}>
            <CurrentLayoutProvider>
              <Child />
            </CurrentLayoutProvider>
          </UserProfileStorageContext.Provider>
        </CacheOnlyLayoutStorageProvider>
      </LayoutCacheContext.Provider>
    </ToastProvider>,
  );
  return { currentLayoutStates, actions, childMounted };
}

describe("CurrentLayoutProvider", () => {
  it.each(["webvizGlobalState", "studioGlobalState"])(
    "migrates legacy layout from localStorage.%s into LayoutStorage/UserProfile",
    async (storageKey) => {
      const storage = new Storage();
      storage.clear();
      const persistedState: { panels: Partial<PanelsState> } = {
        panels: {
          layout: "Foo!bar",
          savedProps: { "Foo!bar": { setting: 1 } },
          globalVariables: { var: "hello" },
          linkedGlobalVariables: [{ topic: "/test", markerKeyPath: [], name: "var" }],
          userNodes: { node1: { name: "node", sourceCode: "node()" } },
          playbackConfig: { speed: 0.1, messageOrder: "headerStamp", timeDisplayMethod: "TOD" },
        },
      };
      storage.setItem(storageKey, persistedState);

      const layoutStoragePutCalled = signal();
      const layoutStorageGetCalled = signal();

      const mockLayoutStorage = makeMockLayoutStorage();
      mockLayoutStorage.put.mockImplementation(async () => layoutStoragePutCalled.resolve());
      mockLayoutStorage.get.mockImplementation(async () => {
        layoutStorageGetCalled.resolve();
        return {
          id: "example",
          path: undefined,
          name: "Example layout",
          state: persistedState.panels,
        };
      });

      const mockUserProfile = makeMockUserProfile();
      mockUserProfile.setUserProfile.mockResolvedValue(undefined);

      const { currentLayoutStates } = renderTest({ mockLayoutStorage, mockUserProfile });

      await act(() => layoutStoragePutCalled);
      await act(() => layoutStorageGetCalled);
      // layoutStoragePutCalled = signal();
      // await act(() => layoutStoragePutCalled);

      const expectedPanelsState = {
        ...persistedState.panels,
        // savedProps gets renamed to configById
        configById: persistedState.panels.savedProps,
        savedProps: undefined,
      };

      expect(mockLayoutStorage.put.mock.calls).toEqual([
        [
          {
            path: [],
            id: expect.any(String),
            name: "unnamed",
            state: persistedState.panels,
          },
        ],
        [
          {
            path: [],
            id: expect.any(String),
            name: "Example layout",
            state: expectedPanelsState,
          },
        ],
      ]);

      expect(currentLayoutStates).toEqual([expectedPanelsState]);
    },
  );

  it("loads first available layout when currentLayoutId is missing", async () => {
    const mockLayoutStorage = makeMockLayoutStorage();
    mockLayoutStorage.list.mockResolvedValue([
      { id: "TEST_ID", name: "Test Layout", state: TEST_LAYOUT },
    ]);
    mockLayoutStorage.get.mockResolvedValueOnce({
      id: "TEST_ID",
      name: "Test Layout",
      state: TEST_LAYOUT,
    });

    const userProfileGetCalled = signal();
    const mockUserProfile = makeMockUserProfile();
    mockUserProfile.getUserProfile.mockImplementation(() => {
      userProfileGetCalled.resolve();
      return {};
    });

    const { currentLayoutStates } = renderTest({ mockLayoutStorage, mockUserProfile });
    await act(() => userProfileGetCalled);

    expect(currentLayoutStates).toEqual([TEST_LAYOUT]);
  });

  it("saves welcome layout when no layouts are available missing", async () => {
    const mockLayoutStorage = makeMockLayoutStorage();
    mockLayoutStorage.list.mockResolvedValue([]);

    const layoutStoragePutCalled = signal();
    mockLayoutStorage.put.mockImplementation(async () => layoutStoragePutCalled.resolve());

    const userProfileGetCalled = signal();
    const mockUserProfile = makeMockUserProfile();
    mockUserProfile.getUserProfile.mockImplementation(() => {
      userProfileGetCalled.resolve();
      return {};
    });

    const { currentLayoutStates } = renderTest({ mockLayoutStorage, mockUserProfile });
    await act(() => userProfileGetCalled);
    await act(() => layoutStoragePutCalled);

    expect(currentLayoutStates).toEqual([welcomeLayout.data]);
  });

  it("uses currentLayoutId from UserProfile to load from LayoutStorage", async () => {
    const expectedState: PanelsState = {
      layout: "Foo!bar",
      configById: { "Foo!bar": { setting: 1 } },
      globalVariables: { var: "hello" },
      linkedGlobalVariables: [{ topic: "/test", markerKeyPath: [], name: "var" }],
      userNodes: { node1: { name: "node", sourceCode: "node()" } },
      playbackConfig: { speed: 0.1, messageOrder: "headerStamp", timeDisplayMethod: "TOD" },
    };
    const layoutStorageGetCalled = signal();
    const mockLayoutStorage = makeMockLayoutStorage();
    mockLayoutStorage.get.mockImplementation(async (): Promise<CachedLayout> => {
      layoutStorageGetCalled.resolve();
      return { id: "example", path: undefined, name: "Example layout", state: expectedState };
    });

    const mockUserProfile = makeMockUserProfile();
    mockUserProfile.getUserProfile.mockResolvedValue({ currentLayoutId: "example" });

    const { currentLayoutStates } = renderTest({ mockLayoutStorage, mockUserProfile });
    await act(() => layoutStorageGetCalled);

    expect(mockLayoutStorage.get.mock.calls).toEqual([["example"]]);
    expect(currentLayoutStates).toEqual([expectedState]);
  });

  it("saves new layout selection into UserProfile", async () => {
    const mockLayoutStorage = makeMockLayoutStorage();
    mockLayoutStorage.get.mockImplementation(async (): Promise<CachedLayout> => {
      return { id: "example", path: undefined, name: "Example layout", state: TEST_LAYOUT };
    });

    const userProfileSetCalled = signal();
    const mockUserProfile = makeMockUserProfile();
    mockUserProfile.getUserProfile.mockResolvedValue({ currentLayoutId: "example" });
    mockUserProfile.setUserProfile.mockImplementation(async () => {
      userProfileSetCalled.resolve();
    });

    const { currentLayoutStates, childMounted, actions } = renderTest({
      mockLayoutStorage,
      mockUserProfile,
    });
    const newLayout: Partial<PanelsState> = {
      ...TEST_LAYOUT,
      layout: "ExamplePanel!2",
    };
    await act(() => childMounted);
    act(() => actions.current?.loadLayout({ id: "example2" as LayoutID, data: newLayout }));
    await act(() => userProfileSetCalled);

    expect(mockUserProfile.setUserProfile.mock.calls).toEqual([[{ currentLayoutId: "example2" }]]);
    expect(currentLayoutStates).toEqual([TEST_LAYOUT, newLayout]);
  });

  it("saves layout updates into LayoutStorage", async () => {
    const layoutStoragePutCalled = signal();
    const mockLayoutStorage = makeMockLayoutStorage();
    mockLayoutStorage.get.mockImplementation(async (): Promise<CachedLayout> => {
      return { id: "TEST_ID", path: undefined, name: "Test layout", state: TEST_LAYOUT };
    });
    mockLayoutStorage.put.mockImplementation(async () => layoutStoragePutCalled.resolve());

    const mockUserProfile = makeMockUserProfile();
    mockUserProfile.getUserProfile.mockResolvedValue({ currentLayoutId: "example" });

    const { currentLayoutStates, childMounted, actions } = renderTest({
      mockLayoutStorage,
      mockUserProfile,
    });
    await act(() => childMounted);
    act(() => actions.current?.setPlaybackConfig({ timeDisplayMethod: "TOD" }));
    await act(() => layoutStoragePutCalled);

    const newState = {
      ...TEST_LAYOUT,
      playbackConfig: {
        ...TEST_LAYOUT.playbackConfig,
        timeDisplayMethod: "TOD",
      },
    };

    expect(mockLayoutStorage.put.mock.calls).toEqual([
      [{ id: "TEST_ID", name: "Test layout", path: [], state: newState }],
    ]);
    expect(currentLayoutStates).toEqual([TEST_LAYOUT, newState]);
  });
});
