// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { HelpInfo } from "../context/HelpInfoContext";
import isDesktopApp from "./isDesktopApp";

export type SectionKey = "app" | "panels" | "resources" | "product" | "legal";
const menuSections: Map<SectionKey, { subheader: string; links: HelpInfo[] }> = new Map([
  [
    "resources",
    {
      subheader: "External resources",
      links: [
        ...(isDesktopApp() ? [] : [{ title: "Desktop app", url: "https://foxglove.dev/download" }]),
        { title: "Read docs", url: "https://foxglove.dev/docs" },
        { title: "Join our community", url: "https://foxglove.dev/community" },
      ],
    },
  ],
  [
    "product",
    {
      subheader: "Product",
      links: [
        { title: "Foxglove Studio", url: "https://foxglove.dev/studio" },
        { title: "Foxglove Data Platform", url: "https://foxglove.dev/data-platform" },
      ],
    },
  ],
  [
    "legal",
    {
      subheader: "Legal",
      links: [
        { title: "License", url: "https://foxglove.dev/legal/studio-license" },
        { title: "Privacy", url: "https://foxglove.dev/legal/privacy" },
      ],
    },
  ],
]);

export default menuSections;
