/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { renderHook } from "@testing-library/react-hooks";
import fetchMock from "fetch-mock";

import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import ExtensionRegistryContext from "@foxglove/studio-base/context/ExtensionRegistryContext";
import { ExtensionInfo } from "@foxglove/studio-base/types/Extensions";

import { useExtensionRegistrySync } from "./useExtensionRegistrySync";

jest.mock("@foxglove/studio-base/context/CurrentUserContext");
jest.mock("@foxglove/studio-base/context/ConsoleApiContext");

function fakeExtension(overrides: Partial<ExtensionInfo>): ExtensionInfo {
  return {
    id: "id",
    description: "description",
    displayName: "display name",
    homepage: "homepage",
    keywords: ["keyword1", "keyword2"],
    license: "license",
    name: "name",
    namespace: "local",
    publisher: "publisher",
    qualifiedName: "qualified name",
    version: "1",
    ...overrides,
  };
}

describe("Private registry sync adapter", () => {
  it("Syncs private extensions", async () => {
    const getExtensions = jest.fn();
    const getExtension = jest.fn();

    (useCurrentUser as jest.Mock).mockReturnValue({ currentUser: true });
    (useConsoleApi as jest.Mock).mockReturnValue({
      getExtensions,
      getExtension,
    });

    const mockRegistryContextValue = {
      downloadExtension: jest.fn(),
      installExtension: jest.fn(),
      loadExtension: jest.fn(),
      refreshExtensions: jest.fn(),
      registeredExtensions: [
        fakeExtension({ namespace: "private", id: "private-installed", version: "1" }),
        fakeExtension({ namespace: "local", id: "local-installed", version: "1" }),
      ],
      registeredPanels: {},
      uninstallExtension: jest.fn(),
    };

    getExtensions.mockReturnValue([
      { id: "id1" },
      { id: "id2" },
      { id: "private-installed", version: 2 },
    ]);
    getExtension.mockReturnValue({ foxe: "url" });

    fetchMock.get("url", new Uint8Array());

    renderHook(useExtensionRegistrySync, {
      wrapper: ({ children }) => (
        <ExtensionRegistryContext.Provider value={mockRegistryContextValue}>
          {children}
        </ExtensionRegistryContext.Provider>
      ),
    });

    // We have to wait for the sync effects to apply since the component won't
    // rerender as a result of syncing.
    await new Promise((resolve) => process.nextTick(resolve));

    expect(mockRegistryContextValue.installExtension).toHaveBeenCalledTimes(3);
    expect(mockRegistryContextValue.installExtension).toHaveBeenCalledWith(
      "private",
      expect.anything(),
    );
    expect(mockRegistryContextValue.uninstallExtension).toHaveBeenCalledTimes(1);
    expect(mockRegistryContextValue.uninstallExtension).toHaveBeenCalledWith(
      "private",
      expect.anything(),
    );
  });
});
