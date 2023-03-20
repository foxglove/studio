// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import { SidebarItemKey } from "@foxglove/studio-base/context/WorkspaceContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks";
import WorkspaceContextProvider from "@foxglove/studio-base/providers/WorkspaceContextProvider";

import Sidebars, { SidebarItem } from ".";

export default {
  title: "components/Sidebar",
  component: Sidebars,
};

const A = () => <>A</>;
const B = () => <>B</>;
const C = () => <>C</>;
const D = () => <>D</>;
const E = () => <>E</>;

const ITEMS = new Map<SidebarItemKey, SidebarItem>([
  ["account", { title: "A", component: A, iconName: "Add" }],
  ["add-panel", { title: "C", component: C, iconName: "Cancel" }],
  ["connection", { title: "D", component: D, iconName: "Delete" }],
  ["extensions", { title: "E", component: E, badge: { count: 2 }, iconName: "Edit" }],
]);

const BOTTOM_ITEMS = new Map<SidebarItemKey, SidebarItem>([
  ["help", { title: "B", component: B, iconName: "ErrorBadge" }],
]);

function Story({
  clickKey,
  defaultSelectedKey,
  enableAppBar,
  height = 300,
}: {
  clickKey?: string;
  defaultSelectedKey?: SidebarItemKey | undefined;
  enableAppBar?: boolean;
  height?: number;
}) {
  const [_, setAppBarEnabled] = useAppConfigurationValue<boolean>(AppSetting.ENABLE_NEW_TOPNAV);

  useEffect(() => {
    if (enableAppBar === true) {
      void setAppBarEnabled(true);
    }
  }, [enableAppBar, setAppBarEnabled]);

  useEffect(() => {
    if (clickKey != undefined) {
      void (async () => {
        const button = document.querySelector<HTMLButtonElement>(
          `button[data-sidebar-key=${clickKey}]`,
        );
        if (button) {
          button.click();
          return;
        }
      })();
    }
  }, [clickKey]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ height }}>
        <WorkspaceContextProvider initialState={{ sidebarItem: defaultSelectedKey }}>
          <Sidebars
            items={ITEMS}
            bottomItems={BOTTOM_ITEMS}
            rightItems={new Map()}
            leftItems={new Map()}
          >
            Main content
          </Sidebars>
        </WorkspaceContextProvider>
      </div>
    </DndProvider>
  );
}

export const Unselected = (): JSX.Element => <Story />;
export const ASelected = (): JSX.Element => <Story defaultSelectedKey="account" />;
export const BSelected = (): JSX.Element => <Story defaultSelectedKey="add-panel" />;

export const ClickToSelect = (): JSX.Element => <Story clickKey="a" />;
ClickToSelect.parameters = { colorScheme: "dark" };
export const ClickToDeselect = (): JSX.Element => (
  <Story defaultSelectedKey="connection" clickKey="a" />
);
ClickToDeselect.parameters = { colorScheme: "dark" };

export const OverflowUnselected = (): JSX.Element => <Story height={200} />;
export const OverflowCSelected = (): JSX.Element => (
  <Story height={200} defaultSelectedKey="extensions" />
);
export const OverflowBSelected = (): JSX.Element => (
  <Story height={200} defaultSelectedKey="help" />
);
