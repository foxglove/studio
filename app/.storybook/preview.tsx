import "@foxglove-studio/app/styles/global.scss";
import "./styles.scss";
import waitForFonts from "@foxglove-studio/app/util/waitForFonts";
import { withScreenshot } from "storycap";
import { withMockSubscribeToNewsletter } from "./__mocks__/subscribeToNewsletter";
import { Story, StoryContext } from "@storybook/react";
import ThemeProvider from "@foxglove-studio/app/theme/ThemeProvider";
import signal from "@foxglove-studio/app/shared/signal";
import ScreenshotContext from "@foxglove-studio/app/stories/ScreenshotContext";
import { useCallback, useRef, useState } from "react";

let loaded = false;

function withScreenshotSignal(Story: Story, { parameters }: StoryContext) {
  const signalRef = useRef(signal());
  const callCount = useRef(0);
  const [error, setError] = useState<Error | undefined>(undefined);
  parameters.screenshot.waitFor = signalRef.current;

  const sceneReady = useCallback(() => {
    if (callCount.current > 0) {
      setError(new Error("withScreenshotSignal: called scene ready more than once"));
      return;
    }
    ++callCount.current;
    signalRef.current.resolve();
  }, []);

  if (error) {
    throw error;
  }

  return (
    <ScreenshotContext.Provider value={sceneReady}>
      <Story />
    </ScreenshotContext.Provider>
  );
}

function withTheme(Story: Story, { parameters }: StoryContext) {
  return (
    <ThemeProvider>
      <Story />
    </ThemeProvider>
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

export const decorators = [
  withTheme,
  withScreenshot,
  withScreenshotSignal,
  withMockSubscribeToNewsletter,
];

export const parameters = {
  // Disable default padding around the page body
  layout: "fullscreen",

  screenshot: {
    // We've seen flaky screenshot sizes like 800x601.
    viewport: { width: 800, height: 600 },
  },
};
