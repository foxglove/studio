// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import RosMaster from "./RosMaster";
import { XmlRpcCreateClientMock as CreateClient } from "./mock/XmlRpcMock";

describe("RosMaster", () => {
  it("Rejects invalid options", () => {
    expect(() => new RosMaster({ xmlRpcCreateClient: CreateClient })).not.toThrow();
    expect(() => new RosMaster({ xmlRpcCreateClient: CreateClient, host: "robot" })).not.toThrow();
    expect(() => new RosMaster({ xmlRpcCreateClient: CreateClient, port: 10000 })).not.toThrow();
    expect(() => new RosMaster({ xmlRpcCreateClient: CreateClient, port: 65536 })).toThrow();
    expect(() => new RosMaster({ xmlRpcCreateClient: CreateClient, host: "" })).toThrow();
    expect(() => new RosMaster({ xmlRpcCreateClient: CreateClient, port: 0 })).toThrow();
    expect(() => new RosMaster({ xmlRpcCreateClient: CreateClient, port: -1 })).toThrow();
  });
});
