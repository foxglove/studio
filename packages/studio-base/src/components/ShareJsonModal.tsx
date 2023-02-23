// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CloseIcon from "@mui/icons-material/Close";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import {
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  styled as muiStyled,
  SvgIcon,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";

import CopyButton from "@foxglove/studio-base/components/CopyButton";
import HoverableIconButton from "@foxglove/studio-base/components/HoverableIconButton";
import Stack from "@foxglove/studio-base/components/Stack";
import { downloadTextFile } from "@foxglove/studio-base/util/download";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

type Props = {
  onRequestClose: () => void;
  onChange: (value: unknown) => void;
  initialValue: unknown;
  noun: string;
  title: string;
};

const StyledTextarea = muiStyled(TextField)(({ theme }) => ({
  ".MuiOutlinedInput-root": {
    backgroundColor: theme.palette.action.hover,
    fontFamily: fonts.MONOSPACE,
    maxHeight: "60vh",
    overflowY: "auto",
    padding: theme.spacing(0.25),
  },
}));

export default function ShareJsonModal({
  initialValue = {},
  onChange,
  onRequestClose,
  noun,
  title,
}: Props): JSX.Element {
  const [value, setValue] = useState(JSON.stringify(initialValue, undefined, 2) ?? "");

  const { decodedValue, error } = useMemo(() => {
    try {
      return { decodedValue: JSON.parse(value === "" ? "{}" : value) as unknown, error: undefined };
    } catch (err) {
      return { decodedValue: undefined, error: err as Error };
    }
  }, [value]);

  const handleSubmit = useCallback(() => {
    onChange(decodedValue);
    onRequestClose();
  }, [decodedValue, onChange, onRequestClose]);

  const handleDownload = useCallback(() => {
    downloadTextFile(value, "layout.json");
  }, [value]);

  const getText = useCallback(() => value, [value]);

  return (
    <Dialog open onClose={onRequestClose} maxWidth="sm" fullWidth>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        paddingX={3}
        paddingTop={2}
      >
        <Stack>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {`Paste a new ${noun} to use it, or copy this one to share it:`}
          </Typography>
        </Stack>

        <IconButton onClick={onRequestClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Stack>
      <DialogContent>
        <StyledTextarea
          fullWidth
          multiline
          rows={10}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
          error={error != undefined}
          helperText={
            error ? "The JSON provided is invalid." : " " // pass whitespace to prevent height from jumping
          }
          FormHelperTextProps={{ variant: "standard" }}
          spellCheck={false}
        />
      </DialogContent>
      <DialogActions>
        <Stack direction="row" gap={1}>
          <IconButton onClick={handleDownload} title="Download" aria-label="Download">
            <SvgIcon>
              <path
                d="M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M12,19L8,15H10.5V12H13.5V15H16L12,19Z"
                fill="currentColor"
              />
            </SvgIcon>
          </IconButton>
          <CopyButton color="default" getText={getText} />
          <HoverableIconButton
            activeColor="error"
            onClick={() => setValue("{}")}
            title="Clear"
            aria-label="Clear"
            icon={<DeleteOutline />}
          />
        </Stack>

        <Stack flex="auto" />

        <Button
          disabled={error != undefined}
          variant="contained"
          size="large"
          onClick={handleSubmit}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
