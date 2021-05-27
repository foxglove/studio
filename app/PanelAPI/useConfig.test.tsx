// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { renderHook, act } from "@testing-library/react-hooks";
import { PropsWithChildren } from "react";

import CurrentLayoutContext from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PanelIdContext } from "@foxglove/studio-base/context/PanelIdContext";
import CurrentLayoutState, {
  DEFAULT_LAYOUT_FOR_TESTS,
} from "@foxglove/studio-base/providers/CurrentLayoutProvider/CurrentLayoutState";

import { useConfig } from "./useConfig";

describe("useConfig", () => {
  it("initializes with a default value", () => {
    const state = new CurrentLayoutState({
      ...DEFAULT_LAYOUT_FOR_TESTS,
    });

    const wrapper = ({ children }: PropsWithChildren<unknown>) => {
      return (
        <CurrentLayoutContext.Provider value={state}>
          <PanelIdContext.Provider value="some-id">{children}</PanelIdContext.Provider>
        </CurrentLayoutContext.Provider>
      );
    };

    const { result } = renderHook(() => useConfig<{ foo: string }>({ foo: "bar" }), { wrapper });
    expect(result.current[0]).toEqual({ foo: "bar" });
  });

  it("initializes with existing value", () => {
    const state = new CurrentLayoutState({
      ...DEFAULT_LAYOUT_FOR_TESTS,
      configById: { "some-id": { foo: 42 } },
    });

    const wrapper = ({ children }: PropsWithChildren<unknown>) => {
      return (
        <CurrentLayoutContext.Provider value={state}>
          <PanelIdContext.Provider value="some-id">{children}</PanelIdContext.Provider>
        </CurrentLayoutContext.Provider>
      );
    };

    const { result } = renderHook(() => useConfig<{ foo: string }>({ foo: "bar" }), { wrapper });
    expect(result.current[0]).toEqual({ foo: 42 });
  });

  it("merges existing value with default value", () => {
    const state = new CurrentLayoutState({
      ...DEFAULT_LAYOUT_FOR_TESTS,
      configById: { "some-id": { foo: 42 } },
    });

    const wrapper = ({ children }: PropsWithChildren<unknown>) => {
      return (
        <CurrentLayoutContext.Provider value={state}>
          <PanelIdContext.Provider value="some-id">{children}</PanelIdContext.Provider>
        </CurrentLayoutContext.Provider>
      );
    };

    const { result } = renderHook(
      () => useConfig<{ foo?: string; another: string }>({ another: "bar" }),
      {
        wrapper,
      },
    );
    expect(result.current[0]).toEqual({ foo: 42, another: "bar" });
  });

  it("should set the config", () => {
    const state = new CurrentLayoutState({
      ...DEFAULT_LAYOUT_FOR_TESTS,
    });

    const wrapper = ({ children }: PropsWithChildren<unknown>) => {
      return (
        <CurrentLayoutContext.Provider value={state}>
          <PanelIdContext.Provider value="some-id">{children}</PanelIdContext.Provider>
        </CurrentLayoutContext.Provider>
      );
    };

    const { result } = renderHook(() => useConfig<{ foo: string }>({ foo: "bar" }), { wrapper });
    expect(result.current[0]).toEqual({ foo: "bar" });

    state.addPanelsStateListener((newState) => {
      expect(newState.configById["some-id"]?.foo).toEqual("reset");
    });

    // invoke setConfig
    act(() => {
      result.current[1]({
        foo: "reset",
      });
    });

    expect(result.current[0]).toEqual({ foo: "reset" });
    expect.assertions(3);
  });
});
