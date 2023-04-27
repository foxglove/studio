// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StepType } from "@reactour/tour";

import { StepContent } from "./StepContent";

const tourId = (id: string) => `[data-tourid=${id}]`;
const simulateClick = (elem: Element | null) =>
  elem?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

const steps: StepType[] = [
  {
    selector: tourId("app-bar"),
    content: (
      <StepContent
        title="Top Bar"
        content="All of your high-level information and controls now live in the top bar."
      />
    ),
    padding: 0,
    position: "top",
  },
  {
    selector: tourId("app-menu"),
    content: (
      <StepContent
        title="App Menu"
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis ligula placerat nisl condimentum vulputate."
      />
    ),
    padding: 0,
  },
  {
    selector: tourId("layout-menu"),
    content: (
      <StepContent
        title="Layout menu"
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis ligula placerat nisl condimentum vulputate."
      />
    ),
    padding: 0,
  },
  {
    selector: tourId("add-panel-button"),
    content: (
      <StepContent
        title="Add panel"
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis ligula placerat nisl condimentum vulputate."
      />
    ),
    padding: 0,
    action: simulateClick,
    highlightedSelectors: [tourId("add-panel-menu")],
    mutationObservables: [tourId("add-panel-menu")],
  },
  {
    selector: tourId("right-sidebar-button"),
    content: (
      <StepContent
        title="Right sidebar"
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis ligula placerat nisl condimentum vulputate."
      />
    ),
    padding: 0,
    action: simulateClick,
    highlightedSelectors: [tourId("right-sidebar")],
    mutationObservables: [tourId("right-sidebar")],
  },
  {
    selector: tourId("user-profile-button"),
    content: (
      <StepContent
        title="User menu"
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis ligula placerat nisl condimentum vulputate."
      />
    ),
    padding: 0,
    action: simulateClick,
    highlightedSelectors: [tourId("account-menu")],
    mutationObservables: [tourId("account-menu")],
  },
];

export default steps;
