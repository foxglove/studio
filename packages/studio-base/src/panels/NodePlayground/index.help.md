Write nodes that manipulate, reduce, and filter existing messages and output them to other Studio panels.

_Node Playground_ scripts are written in [TypeScript](https://www.typescriptlang.org/).

When you create a new node, you’ll be presented with some boilerplate to get started. Every node must declare 3 exports:

- `inputs`: an array of topic names
- `output` topic for the output messages of your node
- `node` function that takes messages from input topics and returns new messages

Check out the _templates_ within the editor for sample nodes.

To debug your code, call `log(someValue, anotherValue)` to print non-function values to the Logs section at the bottom of the editor panel.

You can write more complex nodes that output custom datatypes or listen to multiple input topics. You can even reference [variables](https://foxglove.dev/docs/app-concepts/variables) or import the utility functions listed in the sidebar's "Utilities" tab.

[View docs](https://foxglove.dev/docs/panels/node-playground).
