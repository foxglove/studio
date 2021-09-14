// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dialog, DialogFooter } from "@fluentui/react";
import { useCallback, useContext } from "react";

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
  return (
    <Dialog
      hidden={false}
      onDismiss={() => onComplete({ type: "cancel" })}
      dialogContentProps={{ title: "Hello" }}
      minWidth={320}
      maxWidth={480}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onComplete({ type: "cancel" });
        }}
      >
        Hi there
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
