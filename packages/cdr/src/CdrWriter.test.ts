import { CdrReader } from "./CdrReader";
import { CdrWriter } from "./CdrWriter";

const tf2_msg__TFMessage =
  "0001000001000000cce0d158f08cf9060a000000626173655f6c696e6b000000060000007261646172000000ae47e17a14ae0e4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f03f";

function writeExampleMessage(writer: CdrWriter) {
  // geometry_msgs/TransformStamped[] transforms
  writer.sequenceLength(1);
  // std_msgs/Header header
  // time stamp
  writer.uint32(1490149580); // uint32 sec
  writer.uint32(117017840); // uint32 nsec
  writer.string("base_link"); // string frame_id
  writer.string("radar"); // string child_frame_id
  // geometry_msgs/Transform transform
  // geometry_msgs/Vector3 translation
  writer.float64(3.835); // float64 x
  writer.float64(0); // float64 y
  writer.float64(0); // float64 z
  // geometry_msgs/Quaternion rotation
  writer.float64(0); // float64 x
  writer.float64(0); // float64 y
  writer.float64(0); // float64 z
  writer.float64(1); // float64 w
}

describe("CdrWriter", () => {
  it("serializes an example message with size calculation", () => {
    // Example tf2_msgs/TFMessage
    const writer = new CdrWriter({ size: 100 });
    writeExampleMessage(writer);
    expect(writer.size).toEqual(100);
    expect(Buffer.from(writer.data).toString("hex")).toEqual(tf2_msg__TFMessage);
  });

  it("serializes an example message with preallocation", () => {
    // Example tf2_msgs/TFMessage
    const writer = new CdrWriter({ buffer: new ArrayBuffer(100) });
    writeExampleMessage(writer);
    expect(writer.size).toEqual(100);
    expect(Buffer.from(writer.data).toString("hex")).toEqual(tf2_msg__TFMessage);
  });

  it("serializes an example message with size calculation", () => {
    // Example tf2_msgs/TFMessage
    const writer = new CdrWriter();
    writeExampleMessage(writer);
    expect(writer.size).toEqual(100);
    expect(Buffer.from(writer.data).toString("hex")).toEqual(tf2_msg__TFMessage);
  });

  it("round trips all data types", () => {
    const writer = new CdrWriter();
    writer.int8(-1);
    writer.uint8(2);
    writer.int16(-300);
    writer.uint16(400);
    writer.int32(-500_000);
    writer.uint32(600_000);
    writer.int64(-7_000_000_001n);
    writer.uint64(8_000_000_003n);
    writer.float32(-9.14);
    writer.float64(1.7976931348623158e100);
    writer.string("abc");
    writer.sequenceLength(42);
    const data = writer.data;
    expect(data.byteLength).toEqual(64);

    const reader = new CdrReader(data);
    expect(reader.int8()).toEqual(-1);
    expect(reader.uint8()).toEqual(2);
    expect(reader.int16()).toEqual(-300);
    expect(reader.uint16()).toEqual(400);
    expect(reader.int32()).toEqual(-500_000);
    expect(reader.uint32()).toEqual(600_000);
    expect(reader.int64()).toEqual(-7_000_000_001n);
    expect(reader.uint64()).toEqual(8_000_000_003n);
    expect(reader.float32()).toBeCloseTo(-9.14);
    expect(reader.float64()).toBeCloseTo(1.7976931348623158e100);
    expect(reader.string()).toEqual("abc");
    expect(reader.sequenceLength()).toEqual(42);
  });
});
