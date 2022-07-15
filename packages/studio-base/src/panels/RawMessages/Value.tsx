// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CheckIcon from "@mui/icons-material/Check";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import { styled as muiStyled, Tooltip } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useCallback, useState } from "react";

import HoverableIconButton from "@foxglove/studio-base/components/HoverableIconButton";
import { OpenSiblingPanel } from "@foxglove/studio-base/types/panels";
import clipboard from "@foxglove/studio-base/util/clipboard";

import HighlightedValue from "./HighlightedValue";
import RawMessagesIcons from "./RawMessagesIcons";
import { copyMessageReplacer } from "./copyMessageReplacer";
import { ValueAction } from "./getValueActionForValue";

const useStyles = makeStyles({
  iconBox: {
    display: "inline-block",
    whiteSpace: "nowrap",
    width: 0,
    height: 0,
    position: "relative",
    left: 6,
  },
});

const StyledIconButton = muiStyled(HoverableIconButton)`
  padding: 0;
  font-size: ${({ theme }) => theme.typography.pxToRem(16)};

  &:hover {
    background-color: transparent;
  }
  &:not(:hover) {
    opacity: 0.6;
  }
`;

export default function Value({
  arrLabel,
  basePath,
  itemLabel,
  itemValue,
  valueAction,
  onTopicPathChange,
  openSiblingPanel,
}: {
  arrLabel: string;
  basePath: string;
  itemLabel: string;
  itemValue: unknown;
  valueAction: ValueAction | undefined;
  onTopicPathChange: (arg0: string) => void;
  openSiblingPanel: OpenSiblingPanel;
}): JSX.Element {
  const classes = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((value: string) => {
    void clipboard.copy(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <span>
      <HighlightedValue itemLabel={itemLabel} />
      {arrLabel.length !== 0 && (
        <>
          {arrLabel}
          <Tooltip arrow title={copied ? "Copied" : "Copy to Clipboard"}>
            <StyledIconButton
              size="small"
              aria-label={copied ? "Copied" : "Copy to Clipboard"}
              activeColor={copied ? "success" : "primary"}
              onClick={() => handleCopy(JSON.stringify(itemValue, copyMessageReplacer, 2) ?? "")}
              color="inherit"
              icon={copied ? <CheckIcon fontSize="inherit" /> : <CopyAllIcon fontSize="inherit" />}
            />
          </Tooltip>
        </>
      )}
      <span className={classes.iconBox}>
        {valueAction != undefined ? (
          <RawMessagesIcons
            valueAction={valueAction}
            basePath={basePath}
            onTopicPathChange={onTopicPathChange}
            openSiblingPanel={openSiblingPanel}
          />
        ) : undefined}
      </span>
    </span>
  );
}
