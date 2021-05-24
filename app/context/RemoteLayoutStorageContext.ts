// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";

type LayoutId = string;

export type RemoteLayoutMetadata = {
  id: LayoutId;
  createdAt: { sec: number; nsec: number };
  creatorUid: string;
  name: string;
};

export type RemoteLayout = RemoteLayoutMetadata & {
  data: PanelsState;
};

export interface RemoteLayoutStorage {
  getCurrentUserLayouts: () => Promise<RemoteLayout[]>;
  getSharedLayouts: () => Promise<RemoteLayout[]>;
  getLayoutHistory: (id: LayoutId) => Promise<RemoteLayoutMetadata[]>;

  putCurrentUserLayout: (layout: { name: string; data: PanelsState }) => Promise<void>;
  putSharedLayout: (layout: { name: string; data: PanelsState }) => Promise<void>;
}

const RemoteLayoutStorageContext = createContext<RemoteLayoutStorage | undefined>(undefined);

export function useRemoteLayoutStorage(): RemoteLayoutStorage {
  const ctx = useContext(RemoteLayoutStorageContext);
  if (ctx === undefined) {
    throw new Error("A LayoutStorage provider is required to useLayoutStorage");
  }
  return ctx;
}

export default RemoteLayoutStorageContext;
