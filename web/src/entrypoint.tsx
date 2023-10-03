// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Navigate, createBrowserRouter } from "react-router-dom";

import { main } from "@foxglove/studio-web";

void main(getDefaultRouter);

type Router = ReturnType<typeof createBrowserRouter>;

export async function getDefaultRouter(): Promise<Router> {
  // Use an async import to delay loading the majority of the studio code until the CompatibilityBanner
  // can be displayed. This allows `main` to run browser compatibility checks early in the process.
  const { Root } = await import("@foxglove/studio-web/src/Root");
  const { StudioApp } = await import("@foxglove/studio-base/StudioApp");

  return createBrowserRouter([
    {
      path: "/",
      element: <Root extraProviders={[]} dataSources={[]} />,
      children: [
        { path: "view", element: <StudioApp /> },
        { path: "", element: <StudioApp /> },
      ],
    },
    { path: "*", element: <Navigate to="/view" /> },
  ]);
}
