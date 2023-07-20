// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// eslint-disable-next-line filenames/match-exported
import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { useEffect } from "react";

import { AppOutdatedBanner, useAppOutdatedState } from "./AppOutdatedBanner";

const meta: Meta<typeof AppOutdatedBanner> = {
  title: "AppOutdatedBanner",
  component: AppOutdatedBanner,
  parameters: {
    colorScheme: "light",
  },
  decorators: [
    (Story: StoryFn): JSX.Element => {
      useEffect(() => {
        useAppOutdatedState.setState({ bannerShown: true });
      }, []);
      return <Story />;
    },
  ],
  args: {
    async overrideGetManifest() {
      return { version: FOXGLOVE_STUDIO_VERSION! };
    },
  },
};
export default meta;

export const Dark = {
  parameters: {
    colorScheme: "dark",
  },
};

export const Loading: StoryObj<typeof meta> = {
  args: {
    async overrideGetManifest() {
      return await new Promise(() => {});
    },
  },
};

export const LoadingFailed: StoryObj<typeof meta> = {
  args: {
    async overrideGetManifest() {
      throw new Error("Fake error");
    },
  },
};

export const DifferentVersion: StoryObj<typeof meta> = {
  args: {
    async overrideGetManifest() {
      return { version: "X.Y.Z-fake" };
    },
  },
};

export const SameVersion: StoryObj<typeof meta> = {
  args: {
    async overrideGetManifest() {
      return { version: FOXGLOVE_STUDIO_VERSION! };
    },
  },
};
