import { ExtensionActivate } from "@foxglove/studio";

import { ExamplePanel } from "./ExamplePanel";

export const activate: ExtensionActivate = (ctx) => {
  ctx.registerPanel("${NAME}", async () => ExamplePanel);
};
