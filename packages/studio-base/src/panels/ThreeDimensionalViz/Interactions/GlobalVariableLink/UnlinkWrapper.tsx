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

import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { Tooltip } from "@mui/material";
import { useState, ReactNode } from "react";
import { makeStyles } from "tss-react/mui";

import ChildToggle from "@foxglove/studio-base/components/ChildToggle";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";

import GlobalVariableName from "../GlobalVariableName";
import { LinkedGlobalVariable } from "../useLinkedGlobalVariables";

const useStyles = makeStyles<void, "linkOnIcon" | "linkOffIcon">()((_theme, _props, classes) => ({
  root: {
    display: "flex",
    gap: 6,
  },
  wrapper: {
    marginTop: 1,
    [`&:hover .${classes.linkOnIcon}`]: {
      display: "none",
    },
    [`&:hover .${classes.linkOffIcon}`]: {
      display: "block",
    },
  },
  icon: {
    color: colors.BLUE,
    height: 15,
    width: 15,
  },
  linkOnIcon: {
    display: "block",
  },
  linkOffIcon: {
    display: "none",
  },
}));

type Props = {
  linkedGlobalVariable: LinkedGlobalVariable;
  children: (arg0: {
    // eslint-disable-next-line @foxglove/no-boolean-parameters
    setIsOpen: (arg0: boolean) => void;
    linkedGlobalVariable: LinkedGlobalVariable;
  }) => ReactNode;
  tooltip?: ReactNode;
};

export default function UnlinkWrapper({
  children,
  linkedGlobalVariable,
  tooltip,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { classes, cx } = useStyles();
  return (
    <>
      <ChildToggle
        dataTest={`unlink-${linkedGlobalVariable.name}`}
        position="above"
        onToggle={setIsOpen}
        isOpen={isOpen}
      >
        <div className={classes.wrapper}>
          <Tooltip
            arrow
            placement="top"
            title={
              tooltip ?? (
                <span>
                  Unlink this field from <GlobalVariableName name={linkedGlobalVariable.name} />
                </span>
              )
            }
          >
            <div>
              <LinkIcon className={cx(classes.icon, classes.linkOnIcon)} />
              <LinkOffIcon className={cx(classes.icon, classes.linkOffIcon)} />
            </div>
          </Tooltip>
        </div>
        <span>{children({ setIsOpen, linkedGlobalVariable })}</span>
      </ChildToggle>
      <GlobalVariableName name={linkedGlobalVariable.name} leftPadding />
    </>
  );
}
