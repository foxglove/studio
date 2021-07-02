// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dialog, DialogFooter, TextField } from "@fluentui/react";
import { useCallback, useMemo, useState } from "react";

import Button from "@foxglove/studio-base/components/Button";
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
      styles={{
        main: {
          maxWidth: "700px !important",
        },
      }}
    >
      <TextField
        data-nativeundoredo="true"
        multiline
        autoAdjustHeight
        value={value}
        onChange={(e, newValue) => newValue != undefined && setValue(newValue)}
        autoFocus
        styles={{
          field: {
            fontFamily: "monospace !important",
          },
        }}
      />
      {error && <div className="notification is-danger">The input you provided is invalid.</div>}
      <DialogFooter>
        <Button primary onClick={handleSubmit} className="test-apply" disabled={error != undefined}>
          Apply
        </Button>
        <Button onClick={handleDownload}>Download</Button>
        <Button onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
        <Button onClick={() => setValue("{}")}>Clear</Button>
      </DialogFooter>
    </Dialog>
  );
}
