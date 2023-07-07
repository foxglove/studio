// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// Declarations for @foxglove/schema types to support importing type definitions in user
// scripts.

import { exportTypescriptSchema } from "@foxglove/schemas/internal/exportTypescriptSchema";

import { UserScriptProjectConfig } from "./types";

function declaration(sourceCode: string, name: string) {
  return {
    fileName: `@foxglove/schemas/${name}.d.ts`,
    filePath: `@foxglove/schemas/${name}.d.ts`,
    sourceCode,
  };
}

export function generateFoxgloveSchemaDeclarations(): UserScriptProjectConfig["declarations"] {
  const schemas = exportTypscriptSchema();
  return Object.entries(schemas).map(([name, source]) => declaration(source, name));
}
