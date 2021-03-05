// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import execa, from "execa";
import "colors";

export default function exec(program: string, args: string[]): Promise<unknown> {
  console.log(`::group::\$${program} ${args}`); // eslint-disable-line no-restricted-syntax
  return execa(program, args, { stdio: "inherit" }).finally(() => {
    console.log("::endgroup::"); // eslint-disable-line no-restricted-syntax
  });
}
