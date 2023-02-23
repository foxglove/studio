# Contributing to Foxglove Studio

**Supported development environments:** Linux, Windows, macOS

**Dependencies:**

- [Node.js](https://nodejs.org/en/) v16.10+
- [Git LFS](https://git-lfs.github.com/)
- [Visual Studio Code](https://code.visualstudio.com/) – Recommended

## Getting started

1. Clone repo
1. Run `corepack enable` and `yarn install`
   - If you still get errors about corepack after running `corepack enable`, try uninstalling and reinstalling Node.js. Ensure that Yarn is not separately installed from another source, but is installed _via_ corepack.
1. Launch the development environment:

```sh
# To launch the desktop app (run both scripts concurrently):
$ yarn desktop:serve        # start webpack
$ yarn desktop:start        # launch electron

# To launch the browser app:
$ yarn web:serve

# To launch the browser app using a local instance of the backend server:
$ yarn web:serve:local

# To launch the storybook:
$ yarn storybook

# Advanced usage: running webpack and electron on different computers (or VMs) on the same network
$ yarn desktop:serve --host 192.168.xxx.yyy         # the address where electron can reach the webpack dev server
$ yarn dlx electron@22.1.0 .webpack # launch the version of electron for the current computer's platform

# To launch the desktop app using production API endpoints
$ yarn desktop:serve --env FOXGLOVE_BACKEND=production
$ yarn desktop:start

# NOTE: yarn web:serve does not support connecting to the production endpoints
```

### Other useful commands

```sh
$ yarn run          # list available commands
$ yarn lint         # lint all files
$ yarn test         # run all tests
$ yarn test:watch   # run tests on changed files
```

## Localization (multi-language support)

Foxglove Studio primarily supports English, but a Chinese localization is available with translations provided by community volunteers. Translation support is implemented using [`react-i18next`](https://react.i18next.com).

### Guidelines for translations

- English text **must** be kept up to date in every pull request. Updating translations for other languages in the same pull request is **optional**. We value _high-quality_ translations more than having _some_ translation for each part of the user interface.
- If the English version of an existing translation is changed, and other versions would need to be updated, is better to delete the non-English versions rather than leave them unchanged, since they might become incorrect or confusing.

### Place strings in the `i18n` directory

The [`i18n` directory](packages/studio-base/src/i18n) contains translated (localized) strings for all languages supported by Foxglove Studio.

Translated strings are organized into _namespaces_ — for example, [`i18n/[language]/preferences.ts`](packages/studio-base/src/i18n/en/preferences.ts) contains localization keys and strings for the app's Preferences window.

### Use `useTranslation()` and `t()` to access translated strings

1. Call the [<code>useTranslation(<i>namespace</i>)</code> hook](https://react.i18next.com/latest/usetranslation-hook) inside a React component to access strings in a given namespace. The hook returns a function called `t`.

2. Call the `t` function to get the translated version of a string.

For example:

```ts
const { t } = useTranslation("myComponent");
return <p>{t("hello")}</p>;
```

### Adding localization support to a component

1. Move English strings out of the component code, and into the `i18n` folder. Use a new namespace for logical groups of components or app screens.

2. Replace strings hard-coded in source code with calls to the `t()` function. Use `camelCase` for keys.

<table><tr><th>Before</th><th>After</th></tr><tr><td>

```ts
function MyComponent() {
  return <p>Hello!</p>;
}
```

</td><td>

```ts
function MyComponent() {
  const { t } = useTranslation("myComponent");
  return <p>{t("hello")}</p>;
}
```

```ts
// i18n/en/myComponent.ts
export default {
  hello: "Hello!",
};
```

</td></tr></table>

### Complete example

```ts
// MyComponent.ts

import { useTranslation } from "react-i18next";

function MyComponent(props: Props): JSX.Element {
  const { t } = useTranslation("myComponent");

  return <p>{t("hello")}</p>;
}
```

```ts
// i18n/index.ts
export const translations = {
  en: {
    ...,
    myComponent: enMyComponent,
  },
  zh: {
    ...,
    myComponent: zhMyComponent,
  },
};
```

```ts
// i18n/en/myComponent.ts
export default {
  hello: "Hello!",
};

// i18n/en/index.ts
export { default as enMyComponent } from "./myComponent";
```

```ts
// i18n/zh/myComponent.ts
export default {
  hello: "你好！",
};

// i18n/zh/index.ts
export { default as zhMyComponent } from "./myComponent";
```

Result:

| English         | Chinese         |
| --------------- | --------------- |
| `<p>Hello!</p>` | `<p>你好！</p>` |
