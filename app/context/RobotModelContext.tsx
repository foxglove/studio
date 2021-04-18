// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useCallback, useContext, useState } from "react";
import { useMountedState } from "react-use";
import URDFLoader, { URDFRobot } from "urdf-loader";
import { XacroParser } from "xacro-parser";

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
  const isMounted = useMountedState();

  const loadModelFromFile = useCallback(async (file: File) => {
    const text = await file.text();
    const urdf = await new XacroParser().parse(text);
    const robot = new URDFLoader().parse(urdf);
    if (isMounted()) {
      setModels((prevModels) => [...prevModels, robot]);
    }
  }, []);

  const value = useShallowMemo({ models, loadModelFromFile });

  return <RobotModelContext.Provider value={value}>{children}</RobotModelContext.Provider>;
}

export default RobotModelContext;
