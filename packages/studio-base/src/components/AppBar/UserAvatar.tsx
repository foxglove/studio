// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import PersonIcon from "@mui/icons-material/Person";
import { Avatar } from "@mui/material";
import { makeStyles } from "tss-react/mui";

type Props = {
  className?: string;
  img?: string;
};

const useStyles = makeStyles()((theme) => ({
  root: {
    height: theme.spacing(3.5),
    width: theme.spacing(3.5),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userIconImage: {
    objectFit: "cover",
    width: "100%",
  },
}));

export function UserAvatar(props: Props): JSX.Element {
  const { img, className } = props;
  const { classes, cx } = useStyles();
  return (
    <Avatar className={cx(classes.root, className)} variant="rounded">
      {/**
        Use html object element to handle cases where
        the image URL is present but the app is offline
      */}
      {img ? (
        <object data={img} className={classes.userIconImage} type="image/png">
          <PersonIcon />
        </object>
      ) : (
        <PersonIcon />
      )}
    </Avatar>
  );
}
