// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useCallback, useContext, useState } from "react";
import { URDFRobot } from "urdf-loader/src/URDFClasses";
import URDFLoader from "urdf-loader/src/URDFLoader";

import useShallowMemo from "@foxglove-studio/app/hooks/useShallowMemo";

type RobotModels = {
  loadModelFromFile: (file: File) => void;
  models: readonly URDFRobot[];
};

const RobotModelContext = createContext<RobotModels>({ loadModelFromFile: () => {}, models: [] });

export function useRobotModels(): RobotModels {
  return useContext(RobotModelContext);
}

export function RobotModelProvider({
  children,
}: React.PropsWithChildren<unknown>): React.ReactElement {
  const [models, setModels] = useState<URDFRobot[]>([]);

  const loadModelFromFile = useCallback(async (file: File) => {
    const text = await file.text();
    const loader = new URDFLoader();
    const robot = loader.parse(text);
    setModels((prevModels) => [...prevModels, robot]);
  }, []);

  const value = useShallowMemo({ models, loadModelFromFile });

  return <RobotModelContext.Provider value={value}>{children}</RobotModelContext.Provider>;
}

export default RobotModelContext;
