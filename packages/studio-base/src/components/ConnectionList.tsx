// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ActionButton, Text, useTheme } from "@fluentui/react";
import { useState } from "react";

import {
  PlayerSourceDefinition,
  usePlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

export default function ConnectionList(): JSX.Element {
  const theme = useTheme();
  const [selectedSource, setSelectedSource] = useState<PlayerSourceDefinition | undefined>(
    undefined,
  );
  const { currentSourceName, availableSources } = usePlayerSelection();

  const [count, setCount] = useState(0);

  return (
    <>
      <Text
        block
        styles={{ root: { color: theme.palette.neutralTertiary, marginBottom: theme.spacing.l1 } }}
      >
        {currentSourceName != undefined
          ? currentSourceName
          : "Not connected. Choose a data source below to get started."}
      </Text>
      {selectedSource && <selectedSource.component key={count} />}
      {availableSources.map((source) => {
        return (
          <div key={source.name}>
            <ActionButton
              styles={{
                root: {
                  margin: 0,
                  padding: 0,
                  width: "100%",
                  textAlign: "left",
                },
              }}
              onClick={() => {
                setCount((old) => old + 1);
                setSelectedSource(source);
              }}
            >
              {source.name}
            </ActionButton>
          </div>
        );
      })}
    </>
  );
}
