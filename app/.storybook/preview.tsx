import waitForFonts from "@foxglove-studio/app/util/waitForFonts";
import { withMockSubscribeToNewsletter } from "./__mocks__/subscribeToNewsletter";
import { Story, StoryContext } from "@storybook/react";
import ThemeProvider from "@foxglove-studio/app/theme/ThemeProvider";
import WindowGeometryContext from "@foxglove-studio/app/context/WindowGeometryContext";

import "@foxglove-studio/app/styles/global.scss";
import "./styles.scss";

let loaded = false;

function withTheme(Story: Story, { parameters }: StoryContext) {
  return (
    <ThemeProvider>
      <Story />
    </ThemeProvider>
  );
}

function withWindowGeometry(Story: Story) {
  return (
    <WindowGeometryContext.Provider value={{ insetToolbar: false }}>
      <Story />
    </WindowGeometryContext.Provider>
  );
}

export const loaders = [
  async () => {
    // These loaders are run once for each story when you switch between stories,
    // but the global config can't be safely loaded more than once.
    if (!loaded) {
      await waitForFonts();
      loaded = true;
    }
  },
];

export const decorators = [withTheme, withWindowGeometry, withMockSubscribeToNewsletter];

export const parameters = {
  // Disable default padding around the page body
  layout: "fullscreen",
};
