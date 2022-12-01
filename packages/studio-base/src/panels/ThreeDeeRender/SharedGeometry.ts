// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

export class SharedGeometry {
  /**
   * Store a single instance of each geometry to reuse across scene extensions
   */
  private _geometryMap = new Map<string, THREE.BufferGeometry>();

  public getGeometry<T extends THREE.BufferGeometry>(key: string, creationCallback: () => T): T {
    let geometry = this._geometryMap.get(key);
    if (!geometry) {
      geometry = creationCallback();
      this._geometryMap.set(key, geometry);
    }
    return geometry as T;
  }

  public dispose(): void {
    for (const geometry of this._geometryMap.values()) {
      geometry.dispose();
    }
    this._geometryMap.clear();
  }
}
