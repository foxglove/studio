// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useAsync } from "react-use";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { UITourPopover, UITourProvider } from "@foxglove/studio-base/components/UITour";
import { useUserProfileStorage } from "@foxglove/studio-base/context/UserProfileStorageContext";
import {
  WorkspaceContextStore,
  useWorkspaceStore,
} from "@foxglove/studio-base/context/WorkspaceContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks";

const selectWorkspaceDataSourceDialogOpen = (store: WorkspaceContextStore) =>
  store.dataSourceDialog.open;
const selectWorkspacePrefsDialogOpen = (store: WorkspaceContextStore) =>
  store.prefsDialogState.open;

export function WorkspaceTours(): ReactNull | JSX.Element {
  const prefsDialogOpen = useWorkspaceStore(selectWorkspacePrefsDialogOpen);
  const dataSourceDialogOpen = useWorkspaceStore(selectWorkspaceDataSourceDialogOpen);
  const [enableNewTopNav = false] = useAppConfigurationValue<boolean>(AppSetting.ENABLE_NEW_TOPNAV);

  const userProfileStorage = useUserProfileStorage();
  const { value: userProfile } = useAsync(userProfileStorage.getUserProfile);

  if (userProfile == undefined) {
    return ReactNull;
  }

  const appBarTourShown = userProfile.onboarding?.appBarTourShown === true;
  const showTour =
    !enableNewTopNav && !prefsDialogOpen && !dataSourceDialogOpen && !appBarTourShown;

  return <UITourProvider>{showTour && <UITourPopover />}</UITourProvider>;
}
