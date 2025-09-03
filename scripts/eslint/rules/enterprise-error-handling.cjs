const { AST_NODE_TYPES } = require("@typescript-eslint/utils");
const { createRule } = require("./utils.cjs");

module.exports = createRule({
    name: "enterprise-error-handling",
    meta: {
        docs: {
            description: "Enforce enterprise error handling patterns for Microsoft ecosystem",
        },
        messages: {
            missingErrorHandling: "Async function should include proper error handling with try-catch",
            improperErrorLogging: "Error should be logged with structured logging pattern",
            missingErrorContext: "Error handling should include contextual information",
            asyncWithoutErrorHandling: "Async operations should be wrapped in error handling",
        },
        schema: [],
        type: "problem",
    },
    defaultOptions: [],

    create(context) {
        const isAsyncFunction = node =>
            node.async ||
            (node.type === AST_NODE_TYPES.ArrowFunctionExpression && node.async);

        const hasAwaitExpression = node => {
            let hasAwait = false;
            function visit(child) {
                if (child.type === AST_NODE_TYPES.AwaitExpression) {
                    hasAwait = true;
                    return;
                }
                if (child.body && Array.isArray(child.body)) {
                    child.body.forEach(visit);
                }
                else if (child.body) {
                    visit(child.body);
                }
            }
            if (node.body) visit(node.body);
            return hasAwait;
        };

        const hasTryCatch = node => {
            let hasTry = false;
            function visit(child) {
                if (child.type === AST_NODE_TYPES.TryStatement) {
                    hasTry = true;
                    return;
                }
                if (child.body && Array.isArray(child.body)) {
                    child.body.forEach(visit);
                }
                else if (child.body) {
                    visit(child.body);
                }
            }
            if (node.body) visit(node.body);
            return hasTry;
        };

        const checkAsyncFunction = node => {
            if (isAsyncFunction(node) || hasAwaitExpression(node)) {
                if (!hasTryCatch(node)) {
                    context.report({
                        messageId: "missingErrorHandling",
                        node,
                    });
                }
            }
        };

        const checkTryStatement = node => {
            const catchClause = node.handler;
            if (catchClause && catchClause.body) {
                const hasLogging = catchClause.body.body.some(stmt => {
                    return stmt.type === AST_NODE_TYPES.ExpressionStatement &&
                        stmt.expression.type === AST_NODE_TYPES.CallExpression &&
                        stmt.expression.callee.type === AST_NODE_TYPES.MemberExpression &&
                        (stmt.expression.callee.property.name === "log" ||
                            stmt.expression.callee.property.name === "error" ||
                            stmt.expression.callee.property.name === "warn");
                });

                if (!hasLogging) {
                    context.report({
                        messageId: "improperErrorLogging",
                        node: catchClause,
                    });
                }
            }
        };

        return {
            FunctionDeclaration: checkAsyncFunction,
            FunctionExpression: checkAsyncFunction,
            ArrowFunctionExpression: checkAsyncFunction,
            TryStatement: checkTryStatement,
        };
    },
});
