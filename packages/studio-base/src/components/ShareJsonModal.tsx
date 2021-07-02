// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  DefaultButton,
  Dialog,
  DialogFooter,
  IconButton,
  TextField,
  useTheme,
} from "@fluentui/react";
import { useCallback, useMemo, useState } from "react";

import clipboard from "@foxglove/studio-base/util/clipboard";
import { downloadTextFile } from "@foxglove/studio-base/util/download";

type Props = {
  onRequestClose: () => void;
  onChange: (value: unknown) => void;
  initialValue: unknown;
  noun: string;
  title: string;
};

export default function ShareJsonModal({
  initialValue = {},
  onChange,
  onRequestClose,
  noun,
  title,
}: Props): React.ReactElement {
  const theme = useTheme();
  const [value, setValue] = useState(JSON.stringify(initialValue, undefined, 2));
  const [copied, setCopied] = useState(false);

  const { decodedValue, error } = useMemo(() => {
    try {
      return { decodedValue: JSON.parse(value === "" ? "{}" : value) as unknown, error: undefined };
    } catch (err) {
      return { decodedValue: undefined, error: err };
    }
  }, [value]);

  const handleSubmit = useCallback(() => {
    onChange(decodedValue);
    onRequestClose();
  }, [decodedValue, onChange, onRequestClose]);

  const handleCopy = useCallback(() => {
    clipboard.copy(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);

  const handleDownload = useCallback(() => {
    downloadTextFile(value, "layout.json");
  }, [value]);

  return (
    <Dialog
      hidden={false}
      onDismiss={onRequestClose}
      title={title}
      subText={`Paste a new ${noun} to use it, or copy this one to share it:`}
      maxWidth="700px"
    >
      <TextField
        data-nativeundoredo="true"
        multiline
        rows={10}
        autoAdjustHeight
        value={value}
        onChange={(e, newValue) => newValue != undefined && setValue(newValue)}
        autoFocus
        errorMessage={error && "The JSON provided is invalid."}
        spellCheck={false}
        styles={{
          field: {
            fontFamily: "monospace !important",
          },
        }}
      />
      <DialogFooter
        styles={{
          action: {
            margin: 0,
          },
          actionsRight: {
            display: "flex",
            justifyContent: "space-between",
          },
        }}
      >
        <div>
          <IconButton
            onClick={handleDownload}
            iconProps={{ iconName: "Download" }}
            title="Download"
            ariaLabel="Download"
            styles={{
              root: {
                color: theme.palette.neutralPrimary,
              },
            }}
          />
          <IconButton
            onClick={handleCopy}
            iconProps={{ iconName: copied ? "CheckMark" : "ClipboardList" }}
            title={copied ? "Copied" : "Copy to Clipboard"}
            ariaLabel={copied ? "Copied" : "Copy to Clipboard"}
            styles={{
              root: {
                color: copied ? theme.semanticColors.successIcon : theme.palette.neutralPrimary,
              },
              rootFocused: {
                color: copied ? theme.semanticColors.successIcon : theme.palette.themePrimary,
              },
            }}
          />
          <IconButton
            onClick={() => setValue("{}")}
            iconProps={{ iconName: "Delete" }}
            title="Clear"
            ariaLabel="Clear"
            styles={{
              root: {
                color: theme.palette.neutralPrimary,
              },
              rootHovered: {
                color: theme.semanticColors.errorText,
              },
            }}
          />
        </div>

        <div>
          <DefaultButton onClick={onRequestClose}>Cancel</DefaultButton>
          <DefaultButton primary onClick={handleSubmit} disabled={error != undefined}>
            Apply
          </DefaultButton>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
