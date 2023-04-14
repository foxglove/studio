import { Sparkline, SparklinePoint } from "@foxglove/studio-base/components/Sparkline";

const points: SparklinePoint[] = [
  { value: 5, timestamp: 10 },
  { value: 50, timestamp: 30 },
  { value: 30, timestamp: 60 },
  { value: 100, timestamp: 100 },
];

const props = {
  points,
  width: 300,
  height: 100,
  timeRange: 100,
  nowStamp: 100,
};

export default {
  title: "components/Sparkline",
};

export const Standard = () => {
  return (
    <div style={{ padding: 8 }}>
      <Sparkline {...props} />
    </div>
  );
};

Standard.storyName = "standard";

export const WithExplicitMaximumOf200 = () => {
  return (
    <div style={{ padding: 8 }}>
      <Sparkline {...props} maximum={200} />
    </div>
  );
};

WithExplicitMaximumOf200.storyName = "with explicit maximum of 200";
