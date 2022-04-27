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

import { renderHook } from "@testing-library/react-hooks";
import { ReactNode } from "react";

import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";
import { useCurrentLayoutSelector } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { useStateToURLSynchronization } from "@foxglove/studio-base/hooks/useStateToURLSynchronization";

jest.mock("@foxglove/studio-base/context/CurrentLayoutContext");

function Wrapper({
  children,
  sourceId,
  parameters,
}: {
  children?: ReactNode;
  sourceId?: string;
  parameters?: Record<string, string>;
}) {
  const urlState = sourceId == undefined ? undefined : { sourceId, parameters };

  return <MockMessagePipelineProvider urlState={urlState}>{children}</MockMessagePipelineProvider>;
}

describe("useStateToURLSynchronization", () => {
  it("updates the url with a stable source & player state", () => {
    const location = new URL("http://localhost");
    const replaceState = jest.fn();

    // eslint-disable-next-line id-denylist
    (global as unknown as any).window = {
      history: { replaceState },
      location,
    };

    (useCurrentLayoutSelector as jest.Mock).mockReturnValue(undefined);

    const { rerender } = renderHook(useStateToURLSynchronization, { wrapper: Wrapper });

    expect(replaceState).toHaveBeenCalledWith(undefined, "", "http://localhost/");

    rerender({ sourceId: "test" });

    expect(replaceState).toHaveBeenLastCalledWith(undefined, "", "http://localhost/?ds=test");

    rerender({ sourceId: "test2", parameters: { a: "one", b: "two" } });

    expect(replaceState).toHaveBeenLastCalledWith(
      undefined,
      "",
      "http://localhost/?ds=test2&ds.a=one&ds.b=two",
    );

    (useCurrentLayoutSelector as jest.Mock).mockReturnValue("test-layout");
    rerender();
    expect(replaceState).toHaveBeenLastCalledWith(
      undefined,
      "",
      "http://localhost/?layoutId=test-layout",
    );
  });
});
