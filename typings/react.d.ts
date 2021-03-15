// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// exposes React into the global scope to avoid "import React from 'react'" in every component
/// <reference types="react" />

declare global {
  namespace React {
    // Add an extra overload so that call sites can use `useRef<T>(ReactNull)` instead of
    // `useRef<T | ReactNull>(ReactNull)`.
    declare function useRef<T>(_: ReactNull): MutableRefObject<T | ReactNull>;
  }

  // These aliases are used so that we can prevent null in most places, but still use it
  // where required for React (such as refs and returning from render).
  declare type ReactNull = null;
  declare const ReactNull = null;
}

export {};
