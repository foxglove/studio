// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Settings20Regular, QuestionCircle20Regular } from "@fluentui/react-icons";
import {
  AddIcon,
  AddInIcon,
  CancelIcon,
  DeleteIcon,
  EditIcon,
  ErrorBadgeIcon,
  FiveTileGridIcon,
  RectangularClippingIcon,
  Variable2Icon,
} from "@fluentui/react-icons-mdl2";
import { useTheme } from "@mui/material";
import { useMemo } from "react";

import BlockheadFilledIcon from "@foxglove/studio-base/components/BlockheadFilledIcon";
import BlockheadIcon from "@foxglove/studio-base/components/BlockheadIcon";

import DatabaseSettings from "../assets/database-settings.svg";
import PanelSettings from "../assets/panel-settings.svg";

const ICONS = {
  Add: AddIcon,
  AddIn: AddInIcon,
  Blockhead: BlockheadIcon,
  BlockheadFilled: BlockheadFilledIcon,
  Cancel: CancelIcon,
  DatabaseSettings,
  Delete: DeleteIcon,
  Edit: EditIcon,
  ErrorBadge: ErrorBadgeIcon,
  FiveTileGrid: FiveTileGridIcon,
  PanelSettings,
  QuestionCircle: QuestionCircle20Regular,
  RectangularClipping: RectangularClippingIcon,
  Settings: Settings20Regular,
  Variable2: Variable2Icon,
};

type BuiltinIconProps = {
  name: keyof typeof ICONS;
};

function BuiltinIcon(props: BuiltinIconProps): JSX.Element {
  const theme = useTheme();
  const IconComponent = useMemo(() => ICONS[props.name], [props.name]);
  return <IconComponent color={theme.palette.primary.main} />;
}

export { BuiltinIcon };
