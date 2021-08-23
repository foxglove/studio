// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren, useMemo } from "react";

import { LayoutStorageContext } from "@foxglove/studio-base";

import { useNativeStorage } from "../context/NativeStorageContext";
import NativeStorageLayoutCache from "../services/NativeStorageLayoutCache";

//FIXME - rename
export default function NativeStorageLayoutCacheProvider(
  props: PropsWithChildren<unknown>,
): JSX.Element {
  const storage = useNativeStorage();

  const provider = useMemo(() => {
    return new NativeStorageLayoutCache(storage);
  }, [storage]);

  return (
    <LayoutStorageContext.Provider value={provider}>{props.children}</LayoutStorageContext.Provider>
  );
}
