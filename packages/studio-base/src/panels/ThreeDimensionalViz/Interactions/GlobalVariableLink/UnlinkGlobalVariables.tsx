// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { Button, Card, Typography } from "@mui/material";
import { isEqual } from "lodash";

import Stack from "@foxglove/studio-base/components/Stack";
import GlobalVariableName from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/GlobalVariableName";

import { getPath } from "../interactionUtils";
import useLinkedGlobalVariables, { LinkedGlobalVariable } from "../useLinkedGlobalVariables";
import SGlobalVariableLink from "./SGlobalVariableLink";
import UnlinkWrapper from "./UnlinkWrapper";

type Props = {
  name: string;
  showList?: boolean;
};

export default function UnlinkGlobalVariables({
  name,
  showList = false,
}: Props): JSX.Element | ReactNull {
  const { linkedGlobalVariables, linkedGlobalVariablesByName, setLinkedGlobalVariables } =
    useLinkedGlobalVariables();

  const links: LinkedGlobalVariable[] = linkedGlobalVariablesByName[name] ?? [];
  const firstLink = links[0];

  if (!firstLink) {
    return ReactNull;
  }

  // the list UI is shared between 3D panel and Global Variables panel
  const listHtml = (
    <Stack gap={1} padding={1.5} paddingX={showList ? 0 : undefined}>
      {links.map(({ topic, markerKeyPath, name: linkedGlobalVariableName }, idx) => {
        return (
          <Stack key={idx} gap={1} alignItems="center" direction="row">
            <Button
              variant="contained"
              color="error"
              size="small"
              style={{ flexShrink: 0 }}
              onClick={() => {
                const newLinkedGlobalVariables = linkedGlobalVariables.filter(
                  (linkedGlobalVariable) =>
                    !(
                      linkedGlobalVariable.topic === topic &&
                      isEqual(linkedGlobalVariable.markerKeyPath, markerKeyPath) &&
                      linkedGlobalVariable.name === linkedGlobalVariableName
                    ),
                );
                setLinkedGlobalVariables(newLinkedGlobalVariables);
              }}
            >
              Unlink
            </Button>
            <Typography variant="body2" noWrap title={`${topic}.${getPath(markerKeyPath)}`}>
              {topic}.
              <Typography variant="inherit" display="inline" color="text.secondary">
                {getPath(markerKeyPath)}
              </Typography>
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
  if (showList) {
    return (
      <>
        <Typography variant="body2">
          Some links already exist for this variable. The variable’s value will be taken from the
          most recently clicked linked topic.
        </Typography>
        {listHtml}
      </>
    );
  }

  return (
    <SGlobalVariableLink>
      <UnlinkWrapper
        tooltip={
          <span>
            Unlink <GlobalVariableName name={name} />
          </span>
        }
        linkedGlobalVariable={firstLink}
      >
        {() => (
          <Card
            variant="elevation"
            component="form"
            data-test="unlink-form"
            style={{ pointerEvents: "auto", maxWidth: 320 }}
          >
            {listHtml}
          </Card>
        )}
      </UnlinkWrapper>
    </SGlobalVariableLink>
  );
}
