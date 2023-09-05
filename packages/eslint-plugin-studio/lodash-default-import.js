// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Replace `import { x } from "lodash";` with `import _ from "lodash";` and usage sites with `_.x`.
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      useDefaultImport: `Use 'import _ from "lodash"' instead`,
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
                yield fixer.insertTextBefore(reference.identifier, "_.");
              }
            }
            yield fixer.replaceText(node, `import _ from "lodash";`);
          },
        });
      },
    };
  },
};
