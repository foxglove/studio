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
  DefaultButton,
  PrimaryButton,
} from "@fluentui/react";
import { useCallback, useContext, useMemo, useState } from "react";

import ModalContext from "@foxglove/studio-base/context/ModalContext";
import { Layout } from "@foxglove/studio-base/services/ILayoutStorage";

type UnsavedChangesResolution =
  | { type: "cancel" }
  | { type: "discard" }
  | { type: "makePersonal"; name: string }
  | { type: "overwrite" };

export function UnsavedChangesPrompt({
  layout,
  onComplete,
}: {
  layout: Layout;
  onComplete: (_: UnsavedChangesResolution) => void;
}): JSX.Element {
  const theme = useTheme();

  const options = useMemo(
    () => [
      { key: "discard", text: "Discard changes" },
      {
        key: "update",
        text: `Update team layout “${layout.name}”`,
      },
      { key: "copy", text: "Save a personal copy" },
    ],
    [layout.name],
  );
  const [selectedKey, setSelectedKey] = useState("discard");

  const handleChange = React.useCallback(
    (_event: React.FormEvent | undefined, option: IChoiceGroupOption | undefined): void => {
      if (option) {
        setSelectedKey(option.key);
      }
    },
    [],
  );

  const onCancel = useCallback(() => {
    onComplete({ type: "cancel" });
  }, [onComplete]);

  return (
    <Dialog
      hidden={false}
      onDismiss={onCancel}
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
            selectedKey={selectedKey}
            options={options}
            onChange={handleChange}
            required={true}
          />
          {selectedKey === "discard" && (
            <Text styles={{ root: { color: theme.semanticColors.bodySubtext } }}>
              Your changes will be permantly deleted. This cannot be undone.
            </Text>
          )}
          {selectedKey === "copy" && (
            <TextField autoFocus label="Layout name" defaultValue={`${layout.name} copy`} />
          )}
        </Stack>
        <DialogFooter styles={{ actions: { whiteSpace: "nowrap" } }}>
          <DefaultButton text="Cancel" onClick={onCancel} />
          <PrimaryButton
            text={selectedKey === "B" ? "Discard Changes" : "Save"}
            styles={
              selectedKey === "B"
                ? {
                    root: {
                      backgroundColor: theme.semanticColors.errorText,
                      borderColor: theme.semanticColors.errorText,
                    },
                    rootHovered: {
                      backgroundColor: theme.semanticColors.errorText,
                      borderColor: theme.semanticColors.errorText,
                    },
                    rootChecked: {
                      backgroundColor: theme.semanticColors.errorText,
                      borderColor: theme.semanticColors.errorText,
                    },
                  }
                : {}
            }
          />
        </DialogFooter>
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
