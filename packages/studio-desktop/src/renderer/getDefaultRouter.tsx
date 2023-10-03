// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { Navigate, createHashRouter } from "react-router-dom";

import { IAppConfiguration, StudioApp } from "@foxglove/studio-base";
import Root from "@foxglove/studio-desktop/src/renderer/Root";

type Router = ReturnType<typeof createHashRouter>;

export const getDefaultRouter = async (props: {
  appConfiguration: IAppConfiguration;
}): Promise<Router> =>
  createHashRouter([
    {
      path: "/",
      element: (
        <Root appConfiguration={props.appConfiguration} extraProviders={[]} dataSources={[]} />
      ),
      children: [
        { path: "view", element: <StudioApp /> },
        { path: "", element: <StudioApp /> },
      ],
    },
    { path: "*", element: <Navigate to="/view" /> },
  ]);
