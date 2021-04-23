// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import fs from "fs";
import { Transformer } from "@jest/transform";
// import {} from "@jest/create-cache-key-function";

// look for `?raw` import statements
// re-write these into `const variable = "string source";`;
const importRegEx = /^import (.*) from "(.*)\?raw";$/gm;
const importReplacer = (_: unknown, p1: string, p2: string) => {
  const resolved = require.resolve(p2);
  const rawFile = fs.readFileSync(resolved, { encoding: "utf-8" });
  return `const ${p1} = ${JSON.stringify(rawFile.toString())};`;
};

function rewriteSource(source: string) {
  return source.replace(importRegEx, importReplacer);
}

const transformer: Transformer = {
  process(sourceText, sourcePath, options) {
    return rewriteSource(sourceText);
  },
  // FIXME
  // getCacheKey(
  //   sourceText, sourcePath, options,
  // ) {
  //   cryptod
  //   return transformer.getCacheKey(rewriteSource(source), filePath, options);
  // },
};
module.exports = transformer;
