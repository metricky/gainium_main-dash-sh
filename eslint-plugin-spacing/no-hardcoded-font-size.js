/**
 * ESLint Rule: no-hardcoded-font-size
 *
 * Warns when:
 * 1. Using inline fontSize in style attributes
 * 2. Using arbitrary Tailwind text classes like text-[10px] or text-[0.875rem]
 *
 * Exempts:
 * - Invoice generator
 * - Toast utility
 * - Font size system files
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow hardcoded font sizes in favor of Tailwind text classes',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      inlineFontSize:
        'Avoid inline fontSize. Use Tailwind text classes instead (e.g., text-xs, text-sm, text-base).',
      arbitraryTextClass:
        'Avoid arbitrary text size "{{value}}". Use semantic Tailwind classes instead (e.g., text-xs, text-sm, text-base).',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Skip excluded files
    const excludedPaths = [
      'lib/invoiceGenerator.ts',
      'lib/toast.ts',
      'hooks/useFontSize.ts',
      'hooks/useVisualSettings.ts',
      'hooks/useFontSizeTesting.ts',
      'hooks/useResponsiveText.ts',
    ];

    if (excludedPaths.some((path) => filename.includes(path))) {
      return {};
    }

    return {
      // Check for inline fontSize in JSX
      JSXAttribute(node) {
        // Check for style prop with fontSize
        if (node.name && node.name.name === 'style') {
          const value = node.value;

          if (value && value.type === 'JSXExpressionContainer') {
            const expression = value.expression;

            // Check for fontSize property in object expression
            if (expression.type === 'ObjectExpression') {
              for (const prop of expression.properties) {
                if (
                  prop.type === 'Property' &&
                  prop.key &&
                  (prop.key.name === 'fontSize' ||
                    prop.key.value === 'fontSize')
                ) {
                  context.report({
                    node: prop,
                    messageId: 'inlineFontSize',
                  });
                }
              }
            }
          }
        }

        // Check for arbitrary text-[XXpx] or text-[XXrem] classes
        if (node.name && node.name.name === 'className') {
          const value = node.value;

          if (
            value &&
            value.type === 'Literal' &&
            typeof value.value === 'string'
          ) {
            const arbitraryTextPattern = /text-\[(\d+\.?\d*(?:px|rem))\]/g;
            let match;

            while ((match = arbitraryTextPattern.exec(value.value)) !== null) {
              context.report({
                node: value,
                messageId: 'arbitraryTextClass',
                data: {
                  value: match[0],
                },
              });
            }
          }

          // Also check template literals and expressions
          if (value && value.type === 'JSXExpressionContainer') {
            const expression = value.expression;

            if (expression.type === 'TemplateLiteral') {
              for (const quasi of expression.quasis) {
                const text = quasi.value.raw;
                const arbitraryTextPattern = /text-\[(\d+\.?\d*(?:px|rem))\]/g;
                let match;

                while ((match = arbitraryTextPattern.exec(text)) !== null) {
                  context.report({
                    node: quasi,
                    messageId: 'arbitraryTextClass',
                    data: {
                      value: match[0],
                    },
                  });
                }
              }
            }

            // Check string concatenation and literals in expressions
            if (
              expression.type === 'Literal' &&
              typeof expression.value === 'string'
            ) {
              const arbitraryTextPattern = /text-\[(\d+\.?\d*(?:px|rem))\]/g;
              let match;

              while (
                (match = arbitraryTextPattern.exec(expression.value)) !== null
              ) {
                context.report({
                  node: expression,
                  messageId: 'arbitraryTextClass',
                  data: {
                    value: match[0],
                  },
                });
              }
            }
          }
        }
      },
    };
  },
};
