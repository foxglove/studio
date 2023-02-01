// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren } from "react";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()({
  root: {
    flex: "auto",
  },
});

export function TabPanel(
  props: PropsWithChildren<{
    index: number;
    value: number;
    className?: HTMLElement["className"];
  }>,
): JSX.Element {
  const { classes, cx } = useStyles();
  const { children, value, index, className } = props;

  return (
    <div
      className={cx(classes.root, className)}
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <>{children}</>}
    </div>
  );
}
