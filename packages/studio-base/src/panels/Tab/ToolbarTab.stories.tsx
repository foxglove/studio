import { noop } from "lodash";
import React, { ReactNode } from "react";

import { ToolbarTab } from "@foxglove/studio-base/panels/Tab/ToolbarTab";
import tick from "@foxglove/studio-base/util/tick";

const baseProps = {
  hidden: false,
  highlight: undefined,
  innerRef: undefined,
  isActive: false,
  isDragging: false,
  actions: {
    addTab: noop,
    removeTab: noop,
    selectTab: noop,
    setTabTitle: noop,
  },
  tabCount: 1,
  tabIndex: 0,
  tabTitle: "Tab Title",
};

const Container = React.forwardRef<HTMLDivElement, { children?: ReactNode }>(function Container(
  { children }: any,
  ref,
) {
  return (
    <div style={{ margin: 8 }} ref={ref}>
      {children}
    </div>
  );
});

export default {
  title: "panels/Tab/ToolbarTab",
};

export const Default = () => (
  <Container>
    <ToolbarTab {...baseProps} />
  </Container>
);

Default.storyName = "default";

export const ActiveWithCloseIcon = () => (
  <Container>
    <ToolbarTab {...{ ...baseProps, isActive: true, tabCount: 3 }} />
  </Container>
);

ActiveWithCloseIcon.storyName = "active with close icon";

export const ActiveWithoutCloseIcon = () => (
  <Container>
    <ToolbarTab {...{ ...baseProps, isActive: true, tabCount: 1 }} />
  </Container>
);

ActiveWithoutCloseIcon.storyName = "active without close icon";

export const Hidden = () => (
  <Container>
    <ToolbarTab {...{ ...baseProps, hidden: true }} />
  </Container>
);

Hidden.storyName = "hidden";

export const Highlight = () => (
  <Container>
    <ToolbarTab {...{ ...baseProps, highlight: "before" }} />
  </Container>
);

Highlight.storyName = "highlight";

export const Dragging = () => (
  <Container>
    <ToolbarTab {...{ ...baseProps, isDragging: true }} />
  </Container>
);

Dragging.storyName = "dragging";

export const Editing = () => (
  <Container
    ref={async (el) => {
      await tick();
      if (el) {
        el.querySelectorAll("input")[0]?.click();
      }
    }}
  >
    <ToolbarTab {...{ ...baseProps, isActive: true }} />
  </Container>
);

Editing.storyName = "editing";
