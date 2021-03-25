// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { RawBlock, RawPacket } from "./RawPacket";
import { BlockId, FactoryId, ReturnMode } from "./VelodyneTypes";

const HDL32E_PACKET1 = Buffer.from(
  "/+4QV84ECekJBAoFCN4JCUIFC9cJCnwFBtUJCdEFCNYJCCYGBssJDmsGCbALG8MGCK0LDi8HCK0LFKsHBLILH0IIA7sLFOgIA7sLCtoJB8ILEg8KAMcLE+MJBPgJBOMJB/sJDv/uMVfPBAnaCQQJBQfQCQlCBQnHCQp8BQbDCQfQBQbECQooBga5CQ9pBgi/CSLDBgi5CSMwBwi/CRasBwTGCSY8CAPLCRjzCAPHCQjWCQjPCQ4AAAHSCQ3RCQTjCQTRCQftCQn/7lNXzwQIwgkECQUIwAkJRgUJuQkJfAUGtAkJ1wUFswkMMwYDAAABbAYIsAkLwAYHrAkVMAcIrgkPsgcDtwkTQAgDtgkL4wgDswkEkgkDwAkIiQkFxgkHVQkE1wkEUgkF3AkD/+51V80ECUsJBAgFB0sJB0QFCToJBXwFBkAJBtUFBUMJAyEGBkwJBGoGCZ4JD8QGCKEJEy8HCJwJEKUHA6cJEj4IA6QJC+0IA6MJBIMJBLEJCHwJBbgJCFAJBMQJBEwJB9QJA//ullfNBAlHCQQLBQg+CQdFBQk5CQZ7BQY0CQbaBQU3CQYmBgQ9CQRtBgiMCR/CBgiGCQ4uBwiKCQqkBwOQCRU/CAORCQvsCAOTCQNzCQWXCQdwCQWhCQdCCQSzCQRMCQfBCQT/7rhX0AQJNQkECAUHNwkIRQUJMwkGfAUGKwkH2AUEMQkFKQYGLgkEbQYJdgkPxgYHfAkPKAcJdwkOqAcDgQkZOwgDgwkP7wgDgwkJZAkFkAkLVwkFlQkLLgkDewkLKAkFsgkG/+7aV80ECR8JBAgFBxsJB0MFCRAJBXcFBhMJBtoFBBUJBCgGBBsJBGsGCHUJIsQGCD8JFisHCHAJDqMHA3YJGT0IA3gJD+0IA3YJB1UJBX0JDEkJBoMJDCsJBUUJDisJB5oJDv/u+1fQBAkjCQQGBQgcCQhFBQkXCQd4BQYPCQfYBQQTCQchBgYRCQRtBghiCQ3CBgg0CR4pBwhcCQekBwNXCRc4CANVCRDnCANUCQpGCQVoCRExCQVtCRQPCQM4CQ0OCQSSCRD/7h1YyAQJBgkECgUHAAkGRQUI9QgFegUG+AgG1QUE+ggEKQYGAgkEbAYJUwkLxAYIIgkiJgcHSgkIqAcDSgkmPggDRQkm6AgDQwkPOwkEVgkfHgkGWAk8BwkEMgkMAwkFfQkL/+4/WMwECQMJBAwFB/EIBkMFCfMIB3cFBusIB9MFBO0IBiYGA/MIBGwGCEUJDMQGBxQJIisHBzkJCJ0HAjwJIT4IAzcJJOQIAzgJDiMJAz8JIB8JB0kJO/4IBCQJCQQJBnEJCP/uYVjKBAnwCAQJBQfvCAhCBQnrCAZ7BQbkCAfMBQTqCAYnBgPnCARsBgg1CQ/CBggcCVQlBwMrCQmdBwIrCSY4CAMtCSTnCAMpCQ8fCQQ2CSf8CAQyCTDlCAQdCQfkCARjCQb/7oNYzQQI1wgECAUI1ggFRQUJzggFeAUGzwgGyQUE0AgEIgYA2QgEbQYJJwkZwwYIJQloLQcDHgkJnQcCHQkbOQgDHwkk6AgDHAkOEwkEJQkj/AgGLQk04QgFHAkH4QgGVwkHx28fLTch",
  "base64",
);

describe("RawPacket", () => {
  it("can decode a packet from an HDL-32E", () => {
    const raw = new RawPacket(HDL32E_PACKET1);
    expect(raw.blocks).toHaveLength(12);
    expect(raw.data).toHaveLength(1206);
    expect(raw.factoryField1).toEqual(ReturnMode.Strongest);
    expect(raw.factoryField2).toEqual(FactoryId.HDL32E);
    expect(raw.gpsTimestamp).toEqual(757034951);
    expect(raw.returnMode).toEqual(ReturnMode.Strongest);
    expect(raw.factoryId).toEqual(FactoryId.HDL32E);
    expect(raw.blocks).toHaveLength(12);

    const block0 = raw.blocks[0] as RawBlock;
    expect(block0.data).toHaveLength(100);
    expect(block0.blockId).toEqual(BlockId.Block_0_To_31);
    expect(block0.rotation).toEqual(22288);
    expect(block0.isUpperBlock()).toEqual(false);
    expect(block0.laserReturn(0)).toEqual([1230, 9]);

    for (const block of raw.blocks) {
      expect(block.data).toHaveLength(100);
      expect(block.blockId).toEqual(BlockId.Block_0_To_31);
      expect(block.isUpperBlock()).toEqual(false);
    }
  });
});
