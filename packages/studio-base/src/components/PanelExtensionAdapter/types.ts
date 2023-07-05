// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PanelExtensionContext } from "@foxglove/studio";

/**
 * An asset loaded from Studio's asset management layer.
 */
export type Asset = {
  /** A unique identifier for this asset. */
  name: string;
  /** Binary asset data. */
  data: Uint8Array;

  mediaType?: string;
};

/**
 * PrivateExtensionContext adds additional built-in only functionality to the PanelExtensionContext.
 *
 * These are unstable internal interfaces still in development and not yet available to 3rd party
 * extensions.
 */
export type BuiltinPanelExtensionContext = {
  /**
   * Fetch an asset from Studio's asset management layer.
   *
   * The asset management layer will determine how to fetch the asset. I.E. http(s) uris will use http requests
   * while other schemes may fall back to the data source.
   *
   */
  unstable_fetchAsset: (uri: string, options?: { signal: AbortSignal }) => Promise<Asset>;
} & PanelExtensionContext;
