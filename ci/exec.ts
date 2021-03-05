// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import execa, { ExecaChildProcess } from "execa";

export default function exec(program: string, args: string[]): ExecaChildProcess {
  return execa(program, args, { stdout: "inherit", stderr: "inherit" });
}
