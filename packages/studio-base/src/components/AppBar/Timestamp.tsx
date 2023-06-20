// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useRef } from "react";

import { Time } from "@foxglove/rostime";
import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { useAppConfigurationValue, useAppTimeFormat } from "@foxglove/studio-base/hooks";
import { format } from "@foxglove/studio-base/util/formatTime";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";
import { formatTimeRaw, isAbsoluteTime } from "@foxglove/studio-base/util/time";

export function Timestamp(props: { time?: Time }): JSX.Element | ReactNull {
  const { time } = props;
  const [timezone] = useAppConfigurationValue<string>(AppSetting.TIMEZONE);
  const { timeFormat } = useAppTimeFormat();

  const timeRef = useRef<HTMLDivElement>(ReactNull);

  useEffect(() => {
    if (timeRef.current) {
      if (time) {
        const timeOfDayString = format(time, timezone);
        const timeRawString = formatTimeRaw(time);

        timeRef.current.innerText =
          timeFormat === "SEC" || !isAbsoluteTime(time) ? timeRawString : timeOfDayString;
      } else {
        timeRef.current.innerText = "";
      }
    }
  }, [time, timeFormat, timezone]);

  return (
    <div
      style={{ fontFeatureSettings: `${fonts.SANS_SERIF_FEATURE_SETTINGS}, "zero"` }}
      ref={timeRef}
    />
  );
}
