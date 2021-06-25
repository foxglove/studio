import { CdrSizeCalculator } from "./CdrSizeCalculator";

describe("CdrSizeCalculator", () => {
  it("calculates an example message", () => {
    // Example tf2_msgs/TFMessage
    const calc = new CdrSizeCalculator();
    // geometry_msgs/TransformStamped[] transforms
    calc.sequenceLength();
    // std_msgs/Header header
    // time stamp
    calc.uint32(); // uint32 sec
    calc.uint32(); // uint32 nsec
    calc.string("base_link".length); // string frame_id
    calc.string("radar".length); // string child_frame_id
    // geometry_msgs/Transform transform
    // geometry_msgs/Vector3 translation
    calc.float64(); // float64 x
    calc.float64(); // float64 y
    calc.float64(); // float64 z
    // geometry_msgs/Quaternion rotation
    calc.float64(); // float64 x
    calc.float64(); // float64 y
    calc.float64(); // float64 z
    calc.float64(); // float64 w

    expect(calc.size).toEqual(100);
  });

  it("handles empty strings", () => {
    const calc = new CdrSizeCalculator();
    expect(calc.size).toEqual(4);
    calc.string(0);
    expect(calc.size).toEqual(9);
  });

  it("supports all data types without padding", () => {
    const calc = new CdrSizeCalculator();
    let offset = 0;
    // NOTE: These are carefully ordered to avoid any padding bytes
    expect(calc.size).toEqual((offset += 4));
    expect(calc.int64()).toEqual((offset += 8));
    expect(calc.uint64()).toEqual((offset += 8));
    expect(calc.float64()).toEqual((offset += 8));
    expect(calc.int32()).toEqual((offset += 4));
    expect(calc.uint32()).toEqual((offset += 4));
    expect(calc.float32()).toEqual((offset += 4));
    expect(calc.sequenceLength()).toEqual((offset += 4));
    expect(calc.int16()).toEqual((offset += 2));
    expect(calc.uint16()).toEqual((offset += 2));
    expect(calc.int8()).toEqual((offset += 1));
    expect(calc.uint8()).toEqual((offset += 1));
    expect(calc.uint16()).toEqual((offset += 2));
    expect(calc.string("abc".length)).toEqual((offset += 4 + 3 + 1));
  });

  it("supports all data types with padding", () => {
    const calc = new CdrSizeCalculator();
    // NOTE: These are carefully ordered to force misalignment
    expect(calc.size).toEqual(4);
    expect(calc.int8()).toEqual(5);
    expect(calc.int64()).toEqual(20);
    expect(calc.uint16()).toEqual(22);
    expect(calc.uint32()).toEqual(28);
    expect(calc.string(0)).toEqual(33);
    expect(calc.int16()).toEqual(36);
    expect(calc.uint8()).toEqual(37);
    expect(calc.float32()).toEqual(44);
    expect(calc.uint8()).toEqual(45);
    expect(calc.float64()).toEqual(60);
  });
});
