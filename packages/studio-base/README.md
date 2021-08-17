# @foxglove/studio-base &nbsp; [![npm version](https://img.shields.io/npm/v/@foxglove/studio-base.svg?style=flat)](https://www.npmjs.com/package/@foxglove/studio-base)

This package contains core components used in [Foxglove Studio](https://github.com/foxglove/studio).

## Quick start

This package includes the following exports:

- Components – e.g. `ColorPicker`, `Dropdown`, `Menu`, etc.
- Contexts with providers – `AppConfigurationContext`, `AppConfigurationContext.Provider`, `CurrentLayoutContext`, etc.
- Hooks – `useAddPanel`, `useAppConfigurationValue`, `useNativeAppMenuEvent`, etc.
- Panels – `Map`, `NodePlayground`, `Plot`, etc.
- PanelAPI hooks – `useDataSourceInfo`, `useMessageReducer`, `useMessagesByTopic`, etc.
- Players – `RandomAccessPlayer`, `RosPlayer`, `RosbridgePlayer`, etc.
- Services – `ILayoutCache`, `ILayoutStorage`, `IRemoteLayoutStorage`, etc.
- Styles and theme provider
- Types
- Utils – `formatTime`, `fuzzyFilter`, `naturalSort`, etc.

When contributing to the [Foxglove Studio](https://github.com/foxglove/studio) codebase, you can import these at the top-level:

```
import { ExtensionInfo, ExtensionLoaderContext, ExtensionLoader } from "@foxglove/studio-base";
```

or from lower in the package directory:

```
import fuzzyFilter from "@foxglove/studio-base/util/fuzzyFilter";
```

## Stay in touch

Join us in [Slack](https://foxglove.dev/join-slack) to ask questions, share feedback, and stay up to date on what our team is working on.
