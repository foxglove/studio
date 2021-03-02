// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import markers from "@foxglove-studio/app/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/markers.ts.template";
import pointClouds from "@foxglove-studio/app/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/pointClouds.ts.template";
import readers from "@foxglove-studio/app/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/readers.ts.template";
import time from "@foxglove-studio/app/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/time.ts.template";
import types from "@foxglove-studio/app/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/types.ts.template";
import vectors from "@foxglove-studio/app/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/vectors.ts.template";

export default [
  { fileName: "pointClouds.ts", sourceCode: pointClouds },
  { fileName: "readers.ts", sourceCode: readers },
  { fileName: "time.ts", sourceCode: time },
  { fileName: "types.ts", sourceCode: types },
  { fileName: "vectors.ts", sourceCode: vectors },
  { fileName: "markers.ts", sourceCode: markers },
];
