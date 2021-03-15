import { RosDatatype } from "../src/types";

type TestTypes =
  | "std_msgs/Header"
  | "fake_msgs/HasComplexAndArray"
  | "fake_msgs/HasComplexArray"
  | "fake_msgs/HasByteArray"
  | "fake_msgs/HasJson"
  | "fake_msgs/ContainsEverything"
  | "fake_msgs/HasConstant"
  | "fake_msgs/HasArrayOfEmpties"
  | "fake_msgs/HasInt64s";

type TestRosDatatypes = {
  [key in TestTypes]: RosDatatype;
};

export const definitions: TestRosDatatypes = {
  "std_msgs/Header": {
    fields: [
      { type: "uint32", name: "seq" },
      { type: "time", name: "stamp" },
      { type: "string", name: "frame_id" },
    ],
  },
  "fake_msgs/HasComplexAndArray": {
    fields: [
      { type: "std_msgs/Header", name: "header" },
      { type: "string", isArray: true, name: "stringArray" },
    ],
  },
  "fake_msgs/HasComplexArray": {
    fields: [{ type: "fake_msgs/HasComplexAndArray", name: "complexArray", isArray: true }],
  },
  "fake_msgs/HasConstant": {
    fields: [{ type: "uint8", name: "const", isConstant: true, value: 1 }],
  },
  "fake_msgs/HasByteArray": {
    fields: [{ type: "uint8", name: "byte_array", isArray: true }],
  },
  "fake_msgs/HasJson": {
    fields: [{ type: "json", name: "jsonField" }],
  },
  "fake_msgs/HasInt64s": {
    fields: [
      { type: "int64", name: "i64" },
      { type: "uint64", name: "u64" },
    ],
  },
  "fake_msgs/HasArrayOfEmpties": {
    fields: [{ type: "fake_msgs/HasConstant", name: "arr", isArray: true }],
  },
  "fake_msgs/ContainsEverything": {
    fields: [
      { type: "std_msgs/Header", name: "first" },
      { type: "fake_msgs/HasComplexAndArray", name: "second" },
      { type: "fake_msgs/HasComplexArray", name: "third" },
      { type: "fake_msgs/HasConstant", name: "fourth" },
      { type: "fake_msgs/HasByteArray", name: "fifth" },
      { type: "fake_msgs/HasJson", name: "sixth" },
      { type: "fake_msgs/HasInt64s", name: "seventh" },
      { type: "fake_msgs/HasArrayOfEmpties", name: "eighth" },
    ],
  },
};
