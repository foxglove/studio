import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";
import PlaybackSpeedControls from "@foxglove/studio-base/components/PlaybackSpeedControls";
import MockCurrentLayoutProvider from "@foxglove/studio-base/providers/CurrentLayoutProvider/MockCurrentLayoutProvider";

const CAPABILITIES = ["setSpeed", "playbackControl"];

function ControlsStory() {
  return (
    <div
      style={{ padding: 20, paddingTop: 300 }}
      ref={(el) => {
        setImmediate(() => {
          if (el) {
            (el as any).querySelector("[data-testid=PlaybackSpeedControls-Dropdown]").click();
          }
        });
      }}
    >
      <PlaybackSpeedControls />
    </div>
  );
}

export default {
  title: "components/PlaybackSpeedControls",
};

export const WithoutSpeedCapability = () => {
  return (
    <MockCurrentLayoutProvider>
      <MockMessagePipelineProvider>
        <ControlsStory />
      </MockMessagePipelineProvider>
    </MockCurrentLayoutProvider>
  );
};

WithoutSpeedCapability.storyName = "without speed capability";
WithoutSpeedCapability.parameters = { colorScheme: "dark" };

export const WithoutASpeedFromThePlayer = () => {
  return (
    <MockCurrentLayoutProvider>
      <MockMessagePipelineProvider capabilities={CAPABILITIES} activeData={{ speed: undefined }}>
        <ControlsStory />
      </MockMessagePipelineProvider>
    </MockCurrentLayoutProvider>
  );
};

WithoutASpeedFromThePlayer.storyName = "without a speed from the player";
WithoutASpeedFromThePlayer.parameters = { colorScheme: "dark" };

export const WithASpeed = () => {
  return (
    <MockCurrentLayoutProvider>
      <MockMessagePipelineProvider capabilities={CAPABILITIES}>
        <ControlsStory />
      </MockMessagePipelineProvider>
    </MockCurrentLayoutProvider>
  );
};

WithASpeed.storyName = "with a speed";
WithASpeed.parameters = { colorScheme: "dark" };

export const WithAVerySmallSpeed = () => {
  return (
    <MockCurrentLayoutProvider>
      <MockMessagePipelineProvider capabilities={CAPABILITIES} activeData={{ speed: 0.01 }}>
        <ControlsStory />
      </MockMessagePipelineProvider>
    </MockCurrentLayoutProvider>
  );
};

WithAVerySmallSpeed.storyName = "with a very small speed";
WithAVerySmallSpeed.parameters = { colorScheme: "dark" };
