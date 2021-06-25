import { CdrReader } from "./CdrReader";

describe("CdrReader", () => {
  it("parses an example message", () => {
    // Example tf2_msgs/TFMessage
    const tf2_msg__TFMessage =
      "0001000001000000cce0d158f08cf9060a000000626173655f6c696e6b000000060000007261646172000000ae47e17a14ae0e4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f03f";
    const data = Uint8Array.from(Buffer.from(tf2_msg__TFMessage, "hex"));
    const reader = new CdrReader(data);

    // geometry_msgs/TransformStamped[] transforms
    expect(reader.sequenceLength()).toEqual(1);
    // std_msgs/Header header
    // time stamp
    expect(reader.uint32()).toEqual(1490149580); // uint32 sec
    expect(reader.uint32()).toEqual(117017840); // uint32 nsec
    expect(reader.string()).toEqual("base_link"); // string frame_id
    expect(reader.string()).toEqual("radar"); // string child_frame_id
    // geometry_msgs/Transform transform
    // geometry_msgs/Vector3 translation
    expect(reader.float64()).toBeCloseTo(3.835); // float64 x
    expect(reader.float64()).toBeCloseTo(0); // float64 y
    expect(reader.float64()).toBeCloseTo(0); // float64 z
    // geometry_msgs/Quaternion rotation
    expect(reader.float64()).toBeCloseTo(0); // float64 x
    expect(reader.float64()).toBeCloseTo(0); // float64 y
    expect(reader.float64()).toBeCloseTo(0); // float64 z
    expect(reader.float64()).toBeCloseTo(1); // float64 w
  });
});
