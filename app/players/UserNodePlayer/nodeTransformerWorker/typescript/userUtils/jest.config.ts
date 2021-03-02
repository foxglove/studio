// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { sharedConfig } from "../../../../../../jest.config";

// Custom jest config to support running userUtils tests, which import typescript files
// as ordinary modules (in all other tests they are imported as strings)
// Outside of jest, webpack handles this for us using "?raw" in the module name
module.exports = {
  ...sharedConfig,
  rootDir: "../../../../../..",
  // Only match userUtils tests
  testRegex: "\\/nodeTransformerWorker\\/typescript\\/userUtils\\/.+\\.test\\.tsx?$",
};
