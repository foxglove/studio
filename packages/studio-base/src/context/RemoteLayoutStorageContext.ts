// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import { IRemoteLayoutStorage } from "@foxglove/studio-base/services/IRemoteLayoutStorage";

const RemoteLayoutStorageContext = createContext<IRemoteLayoutStorage | undefined>(undefined);

export function useRemoteLayoutStorage(): IRemoteLayoutStorage {
  const ctx = useContext(RemoteLayoutStorageContext);
  if (ctx == undefined) {
    throw new Error("A LayoutStorage provider is required to useRemoteLayoutStorage");
  }
  return ctx;
}

export default RemoteLayoutStorageContext;
