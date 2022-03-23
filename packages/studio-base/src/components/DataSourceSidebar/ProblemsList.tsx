// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ErrorIcon from "@mui/icons-material/ErrorOutline";
import WarningIcon from "@mui/icons-material/WarningAmber";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useCallback, useContext } from "react";

import NotificationModal from "@foxglove/studio-base/components/NotificationModal";
import Stack from "@foxglove/studio-base/components/Stack";
import ModalContext from "@foxglove/studio-base/context/ModalContext";
import { PlayerProblem } from "@foxglove/studio-base/players/types";

export function ProblemsList({ problems }: { problems: PlayerProblem[] }): JSX.Element {
  const modalHost = useContext(ModalContext);

  const showProblemModal = useCallback(
    (problem: PlayerProblem) => {
      const remove = modalHost.addModalElement(
        <NotificationModal
          notification={{
            message: problem.message,
            subText: problem.tip,
            details: problem.error,
            severity: problem.severity,
          }}
          onRequestClose={() => remove()}
        />,
      );
    },
    [modalHost],
  );

  return (
    <>
      {problems.length > 0 ? (
        <List disablePadding>
          {problems.map((problem, idx) => (
            <ListItem disablePadding key={`${idx}`}>
              <ListItemButton onClick={() => showProblemModal(problem)}>
                <ListItemIcon>
                  {problem.severity === "error" ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={problem.message}
                  primaryTypographyProps={{
                    color: problem.severity === "error" ? "error.main" : "warning.main",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Stack flex="auto" padding={2}>
          Haz no problems
        </Stack>
      )}
    </>
  );
}
