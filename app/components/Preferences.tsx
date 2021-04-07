// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import {
  Checkbox,
  ChoiceGroup,
  ChoiceGroupOption,
  ComboBox,
  DirectionalHint,
  IChoiceGroupOption,
  IComboBoxOption,
  Label,
  Pivot,
  PivotItem,
  SelectableOptionMenuItemType,
  Stack,
  Text,
  useTheme,
} from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import moment from "moment-timezone";
import { useCallback, useMemo, useState } from "react";

import OsContextSingleton from "@foxglove-studio/app/OsContextSingleton";
import { ExperimentalFeatureSettings } from "@foxglove-studio/app/components/ExperimentalFeatureSettings";
import { useAsyncAppConfigurationValue } from "@foxglove-studio/app/hooks/useAsyncAppConfigurationValue";

function formatTimezone(name: string) {
  const tz = moment.tz(name);
  const zoneAbbr = tz.zoneAbbr();
  const offset = tz.utcOffset();
  const offsetStr =
    (offset >= 0 ? "+" : "") + moment.duration(offset, "minutes").format("hh:mm", { trim: false });
  if (name === zoneAbbr) {
    return `${zoneAbbr} (${offsetStr})`;
  }
  return `${name} (${zoneAbbr}, ${offsetStr})`;
}

function TimezoneSettings(): React.ReactElement {
  const [timezone, setTimezone] = useAsyncAppConfigurationValue<string>("timezone");
  const options: IComboBoxOption[] = useMemo(() => {
    const result: IComboBoxOption[] = moment.tz.names().map((name) => {
      return { key: `zone:${name}`, id: name, text: formatTimezone(name) };
    });

    result.unshift(
      { key: "detect", text: `Detect from system: ${formatTimezone(moment.tz.guess())}` },
      { key: "utc", text: `${formatTimezone("UTC")}` },
      { key: "sep", text: "-", itemType: SelectableOptionMenuItemType.Divider },
    );

    return result;
  }, []);

  const onTimezoneSettingChange = useCallback((event, option?: IChoiceGroupOption) => {}, []);

  const comboBoxId = useId("timezoneBox");

  return (
    <>
      <Label htmlFor={comboBoxId}>Display timestamps in:</Label>
      <ComboBox
        id={comboBoxId}
        allowFreeform
        options={options}
        selectedKey={timezone.value}
        onChange={(event, option) => setTimezone(option?.id ?? "")}
        style={{ maxWidth: 300 }}
        calloutProps={{
          directionalHintFixed: true,
          directionalHint: DirectionalHint.bottomAutoEdge,
        }}
      />
    </>
  );
}

export default function Preferences(): React.ReactElement {
  // const [timezone, setTimezone] = useAsyncAppConfigurationValue<string>("timezone");

  // FIXME: these need to set preferences which are read on launch
  const [telemetryEnabled, setTelemetryEnabled] = useState(
    OsContextSingleton?.isTelemetryEnabled(),
  );
  const [crashReportingEnabled, setCrashReportingEnabled] = useState(
    OsContextSingleton?.isCrashReportingEnabled(),
  );

  const theme = useTheme();
  return (
    <Pivot>
      <PivotItem headerText="Settings" style={{ padding: theme.spacing.m }}>
        <Stack.Item>
          <TimezoneSettings />
        </Stack.Item>
      </PivotItem>
      <PivotItem headerText="Privacy" style={{ padding: theme.spacing.m }}>
        <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
          <Text style={{ color: theme.palette.neutralSecondary }}>
            Changes will take effect the next time {APP_NAME} is launched.
          </Text>
          <Checkbox
            checked={telemetryEnabled}
            onChange={(event, checked) => setTelemetryEnabled(checked)}
            label={`Send anonymized usage data to help us improve ${APP_NAME}`}
          />
          <Checkbox
            checked={crashReportingEnabled}
            onChange={(event, checked) => setCrashReportingEnabled(checked)}
            label="Send anonymized crash reports"
          />
        </Stack>
      </PivotItem>
      <PivotItem headerText="Experimental Features" itemIcon="TestBeakerSolid">
        <ExperimentalFeatureSettings />
      </PivotItem>
    </Pivot>
  );
}
