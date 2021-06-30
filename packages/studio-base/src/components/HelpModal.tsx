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

import { IconButton, Modal, makeStyles, useTheme } from "@fluentui/react";
import { PropsWithChildren, ReactElement } from "react";

import TextContent from "@foxglove/studio-base/components/TextContent";

const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing.l1,
  },
  header: {
    backgroundColor: theme.semanticColors.bodyBackground,
    display: "flex",
    flexDirection: "space-between",
    justifyContent: "flex-end",
    padding: theme.spacing.s1,
    position: "sticky",
    top: 0,
  },
}));

export default function HelpModal({
  onRequestClose,
  children,
}: PropsWithChildren<{ onRequestClose: () => void }>): ReactElement {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <Modal
      isOpen
      onDismiss={onRequestClose}
      styles={{
        scrollableContent: {
          maxWidth: 700,
          maxHeight: `calc(100vh - ${theme.spacing.l2})`,
        },
      }}
    >
      <div className={classes.header}>
        <IconButton
          styles={{
            root: {
              color: theme.palette.neutralSecondary,
              margin: 0, // TODO: remove this once global.scss is removed
            },
            rootHovered: {
              color: theme.palette.neutralSecondaryAlt,
            },
          }}
          ariaLabel="Close help modal"
          iconProps={{ iconName: "Clear" }}
          onClick={onRequestClose}
        />
      </div>
      <div className={classes.content}>
        <TextContent allowMarkdownHtml={true}>{children}</TextContent>
      </div>
    </Modal>
  );
}
