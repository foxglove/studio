// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useCallback, useContext, useState } from "react";
import { useMountedState } from "react-use";
import * as THREE from "three";
import URDFLoader, { URDFRobot } from "urdf-loader";
import { XacroParser } from "xacro-parser";

import useShallowMemo from "@foxglove-studio/app/hooks/useShallowMemo";

type RobotModel = {
  loadModelFromFile: (file: File) => void;
  model?: URDFRobot;
};

const RobotModelContext = createContext<RobotModel>({
  loadModelFromFile: () => {},
  model: undefined,
});

export function useRobotModel(): RobotModel {
  return useContext(RobotModelContext);
}

export function RobotModelProvider({
  children,
}: React.PropsWithChildren<unknown>): React.ReactElement {
  const [model, setModel] = useState<URDFRobot | undefined>();
  const isMounted = useMountedState();

  const loadModelFromFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const urdf = await new XacroParser().parse(text);

      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        // TIFF images are not supported by Chrome. Use a custom protocol handler to locate and decode TIFFs.
        if (/^x-foxglove-ros-package:.+\.tiff?$/i.test(url)) {
          return url.replace(/^x-foxglove-ros-package:/, "x-foxglove-ros-package-converted-tiff:");
        }
        return url;
      });

      const loader = new URDFLoader(manager);
      const finishedLoading = new Promise<void>((resolve, reject) => {
        manager.onLoad = () => resolve();
        manager.onError = (url) => reject(new Error(`Failed to load ${url}`));
      });

      // URDFLoader appends the resource path to the URL we give it. We include the ROS package name
      // and the path of the URDF file so the protocol handler can look up the package location
      // relative to the dropped URDF file.
      (loader as any).packages = (targetPkg: string) => {
        return `x-foxglove-ros-package:?targetPkg=${encodeURIComponent(
          targetPkg,
        )}&basePath=${encodeURIComponent(file.path)}&relPath=`;
      };

      const robot = loader.parse(urdf);
      await finishedLoading;
      if (isMounted()) {
        setModel(robot);
      }
    },
    [isMounted],
  );

  const value = useShallowMemo({ model, loadModelFromFile });

  return <RobotModelContext.Provider value={value}>{children}</RobotModelContext.Provider>;
}

export default RobotModelContext;
