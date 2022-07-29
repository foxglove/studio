// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

import { iterableTransferHandler } from "@foxglove/comlink-transfer-handlers";

import { RosDb3IterableSource } from "./RosDb3IterableSource";

Comlink.transferHandlers.set("iterable", iterableTransferHandler);
Comlink.expose(RosDb3IterableSource);
