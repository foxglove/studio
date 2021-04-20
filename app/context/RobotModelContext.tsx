// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useMountedState } from "react-use";
import * as THREE from "three";
import URDFLoader, { URDFRobot } from "urdf-loader";
import { XacroParser } from "xacro-parser";

import { useParameter } from "@foxglove-studio/app/PanelAPI";
import useShallowMemo from "@foxglove-studio/app/hooks/useShallowMemo";
import sendNotification from "@foxglove-studio/app/util/sendNotification";
import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

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

const URDF_ROOT = "$URDF_ROOT";

export function RobotModelProvider({
  children,
}: React.PropsWithChildren<unknown>): React.ReactElement {
  const [model, setModel] = useState<URDFRobot | undefined>();
  const isMounted = useMountedState();
  const [modelFromParam] = useParameter<string>("/robot_description");

  const loadURDF = useCallback(
    async (text: string, basePath: string | undefined) => {
      const xacroParser = new XacroParser();
      xacroParser.rospackCommands = {
        // Translate find commands to `package://` URLs, which makes the XacroParser treat them as
        // absolute paths while allowing us to re-parse and translate these to
        // x-foxglove-ros-package URLs later.
        find: (targetPkg) => `package://${targetPkg}`,
      };
      xacroParser.getFileContents = async (path: string) => {
        // Given a fully formed package:// URL, translate it to something we can actually fetch.
        const match = path.match(/^package:\/\/([^/]+)\/(.+)$/);
        if (!match) {
          throw new Error(`Unable to get file contents for ${path}`);
        }
        const targetPkg = match[1] as string;
        const relPath = match[2] as string;
        let url = `x-foxglove-ros-package:?targetPkg=${targetPkg}`;
        if (basePath != undefined) {
          url += `&basePath=${encodeURIComponent(basePath)}`;
        }
        url += `&relPath=${encodeURIComponent(relPath)}`;
        return (await fetch(url)).text();
      };
      const urdf = await xacroParser.parse(text);
      log.info("Parsing URDF", urdf);

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
        manager.onError = (url) =>
          reject(
            new Error(
              `Failed to load ${url}. Loading assets from ROS packages requires the ROS_PACKAGE_PATH environment variable to be set.`,
            ),
          );
      });

      // URDFLoader appends the resource path to the URL we give it. We include the ROS package name
      // and the path of the URDF file so the protocol handler can look up the package location
      // relative to the dropped URDF file.
      (loader as any).packages = (targetPkg: string) => {
        let url = `x-foxglove-ros-package:?targetPkg=${encodeURIComponent(targetPkg)}`;
        if (basePath != undefined) {
          url += `&basePath=${encodeURIComponent(basePath)}`;
        }
        return url + `&relPath=`;
      };

      manager.itemStart(URDF_ROOT);
      const robot = loader.parse(urdf);
      manager.itemEnd(URDF_ROOT);
      await finishedLoading;
      if (robot.children.length === 0) {
        sendNotification(
          "URDF file is empty",
          `The processed URDF file${
            basePath != undefined ? ` from ${basePath}` : ""
          } contained no visual elements.`,
          "user",
          "warn",
        );
      }
      if (isMounted()) {
        setModel(robot);
      }
    },
    [isMounted],
  );

  useEffect(() => {
    (async () => {
      if (modelFromParam != undefined) {
        try {
          await loadURDF(modelFromParam, undefined);
        } catch (err) {
          if (isMounted()) {
            sendNotification("Error loading URDF from /robot_description", err, "user", "warn");
          }
        }
      }
    })();
  }, [modelFromParam, loadURDF, isMounted]);

  const loadModelFromFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        await loadURDF(text, file.path);
      } catch (err) {
        if (isMounted()) {
          sendNotification("Error loading URDF from file", err, "user", "warn");
        }
      }
    },
    [isMounted, loadURDF],
  );

  const value = useShallowMemo({ model, loadModelFromFile });

  return <RobotModelContext.Provider value={value}>{children}</RobotModelContext.Provider>;
}

export default RobotModelContext;
