// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useAsyncAppConfigurationValue } from "@foxglove-studio/app/hooks/useAsyncAppConfigurationValue";

export default function useRosHostname(): string | undefined {
  const [rosHostname] = useAsyncAppConfigurationValue<string>("ros1.ros_hostname");
  return rosHostname.value === "" ? undefined : rosHostname.value;
}
