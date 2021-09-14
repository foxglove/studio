// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  ChoiceGroup,
  IChoiceGroupOption,
  Dialog,
  DialogFooter,
  Stack,
  Text,
  TextField,
  useTheme,
} from "@fluentui/react";
import { useCallback, useContext, FormEvent } from "react";

import ModalContext from "@foxglove/studio-base/context/ModalContext";
import { Layout } from "@foxglove/studio-base/services/ILayoutStorage";

type UnsavedChangesResolution =
  | { type: "cancel" }
  | { type: "discard" }
  | { type: "makePersonal"; name: string }
  | { type: "overwrite" };

const options: IChoiceGroupOption[] = [
  {
    key: "update",
    text: (
      <>
        Update team layout <b>“Layout name”</b>
      </>
    ),
  },
  { key: "discard", text: "Discard changes" },
  { key: "copy", text: "Save a personal copy" },
];

export function UnsavedChangesPrompt({
  layout,
  onComplete,
}: {
  layout: Layout;
  onComplete: (_: UnsavedChangesResolution) => void;
}): JSX.Element {
  const theme = useTheme();
  const [choice, setChoice] = React.useState<IChoiceGroupOption>(options[2]);
  const handleChange = React.useCallback(
    (ev: FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
      setChoice(option);
    },
    [],
  );

  return (
    <Dialog
      hidden={false}
      onDismiss={() => onComplete({ type: "cancel" })}
      dialogContentProps={{ title: "You have unsaved changes" }}
      minWidth={320}
      maxWidth={480}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onComplete({ type: "cancel" });
        }}
      >
        <Stack tokens={{ childrenGap: theme.spacing.m }} styles={{ root: { minHeight: 180 } }}>
          <ChoiceGroup
            defaultSelectedKey="update"
            options={options}
            onChange={handleChange}
            required={true}
          />
          {choice.key === "discard" && (
            <Text styles={{ root: { color: theme.semanticColors.bodySubtext } }}>
              Your changes will be permantly deleted, this cannot be undone.
            </Text>
          )}
          {choice.key === "copy" && (
            <TextField autoFocus label="Layout name" defaultValue="Layout name copy" />
          )}
        </Stack>
        <DialogFooter styles={{ actions: { whiteSpace: "nowrap" } }}>Buttons here</DialogFooter>
      </form>
    </Dialog>
  );
}

export function useUnsavedChangesPrompt(): (item: Layout) => Promise<UnsavedChangesResolution> {
  const modalHost = useContext(ModalContext);

  const openPrompt = useCallback(
    async (layout: Layout) => {
      return await new Promise<UnsavedChangesResolution>((resolve) => {
        const remove = modalHost.addModalElement(
          <UnsavedChangesPrompt
            layout={layout}
            onComplete={(value) => {
              resolve(value);
              remove();
            }}
          />,
        );
      });
    },
    [modalHost],
  );

  return openPrompt;
}
