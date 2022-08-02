// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import MockCurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider/MockCurrentLayoutProvider";

import VariablesSidebar from ".";

export default {
  title: "components/VariablesSidebar",
  component: VariablesSidebar,
};

const initialState = {
  globalVariables: {
    selected_id: 1234,
    linked_variable: { seq: 0, stamp: { sec: 1535385092, nsec: 150099000 }, frame_id: "map" },
  },
  linkedGlobalVariables: [
    {
      topic: "linked_variable",
      markerKeyPath: ["", ""],
      name: "linked_variable",
    },
  ],
};

export function Default(): JSX.Element {
  return (
    <DndProvider backend={HTML5Backend}>
      <MockCurrentLayoutProvider>
        <VariablesSidebar />
      </MockCurrentLayoutProvider>
    </DndProvider>
  );
}

export function WithVariablesLight(): JSX.Element {
  return (
    <DndProvider backend={HTML5Backend}>
      <MockCurrentLayoutProvider initialState={initialState}>
        <VariablesSidebar />
      </MockCurrentLayoutProvider>
    </DndProvider>
  );
}

WithVariablesLight.parameters = { colorScheme: "light" };

export function WithVariablesDark(): JSX.Element {
  return (
    <DndProvider backend={HTML5Backend}>
      <MockCurrentLayoutProvider initialState={initialState}>
        <VariablesSidebar />
      </MockCurrentLayoutProvider>
    </DndProvider>
  );
}

WithVariablesDark.parameters = { colorScheme: "dark" };
