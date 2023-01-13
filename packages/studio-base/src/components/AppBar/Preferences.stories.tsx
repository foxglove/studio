// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PreferencesDialog } from "@foxglove/studio-base/components/AppBar/Preferences";

export default {
  title: "components/PreferencesDialog",
  component: PreferencesDialog,
  parameters: { colorScheme: "light" },
};

export function Default(): JSX.Element {
  return <PreferencesDialog open />;
}

export function General(): JSX.Element {
  return <PreferencesDialog open activeTab="general" />;
}

export function Privacy(): JSX.Element {
  return <PreferencesDialog open activeTab="privacy" />;
}

export function Extensions(): JSX.Element {
  return <PreferencesDialog open activeTab="extensions" />;
}

export function Experimental(): JSX.Element {
  return <PreferencesDialog open activeTab="experimental-features" />;
}

export function About(): JSX.Element {
  return <PreferencesDialog open activeTab="about" />;
}
