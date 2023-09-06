// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Support renamed imports, e.g. return `"get"` for `import { get as lodashGet } from "lodash";`.
 * @param {import("eslint").Scope.Variable} variable
 */
function getImportedName(variable) {
  for (const def of variable.defs) {
    if (def.type === "ImportBinding" && def.node.type === "ImportSpecifier") {
      return def.node.imported.name;
    }
  }
  return variable.name;
}

/**
 * Replace `import { x } from "lodash";` with `import * as _ from "lodash";` and usage sites with `_.x`.
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      useDefaultImport: `Use 'import * as _ from "lodash"' instead`,
    },
  },
  create: (context) => {
    return {
      [`ImportDeclaration[source.value="lodash"]:has(ImportSpecifier)`]: (node) => {
        context.report({
          node,
          messageId: "useDefaultImport",
          *fix(fixer) {
            const variables = context.getDeclaredVariables(node);
            for (const variable of variables) {
              for (const reference of variable.references) {
                yield fixer.replaceText(reference.identifier, `_.${getImportedName(variable)}`);
              }
            }
            yield fixer.replaceText(node, `import * as _ from "lodash";`);
          },
        });
      },
    };
  },
};
