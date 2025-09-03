const { AST_NODE_TYPES } = require("@typescript-eslint/utils");
const { createRule } = require("./utils.cjs");

module.exports = createRule({
    name: "azure-compatibility",
    meta: {
        docs: {
            description: "Enforce Azure-compatible coding patterns for Microsoft ecosystem",
        },
        messages: {
            preferAzureLogging: "Use Azure-compatible logging patterns (console.log, console.error, etc.)",
            avoidSyncOperations: "Avoid synchronous file operations in Azure environments",
            preferEnvironmentConfig: "Use environment variables for configuration in Azure deployments",
            azureNamingConvention: "Follow Azure naming conventions for resources and functions",
        },
        schema: [],
        type: "suggestion",
    },
    defaultOptions: [],

    create(context) {
        const azureIncompatibleSyncMethods = [
            "readFileSync",
            "writeFileSync",
            "existsSync",
            "statSync",
            "readdirSync",
        ];

        const checkSyncOperations = node => {
            if (
                node.type === AST_NODE_TYPES.CallExpression &&
                node.callee.type === AST_NODE_TYPES.MemberExpression &&
                node.callee.property.type === AST_NODE_TYPES.Identifier &&
                azureIncompatibleSyncMethods.includes(node.callee.property.name)
            ) {
                context.report({
                    messageId: "avoidSyncOperations",
                    node,
                });
            }
        };

        const checkHardcodedConfig = node => {
            if (
                node.type === AST_NODE_TYPES.VariableDeclarator &&
                node.init &&
                node.init.type === AST_NODE_TYPES.Literal &&
                typeof node.init.value === "string" &&
                (node.init.value.includes("localhost") ||
                    node.init.value.includes("127.0.0.1") ||
                    node.init.value.includes("http://") && !node.init.value.includes("process.env"))
            ) {
                context.report({
                    messageId: "preferEnvironmentConfig",
                    node,
                });
            }
        };

        const checkAzureNaming = node => {
            if (
                node.type === AST_NODE_TYPES.FunctionDeclaration &&
                node.id &&
                node.id.name
            ) {
                const functionName = node.id.name;
                if (functionName.includes("azure") || functionName.includes("Azure")) {
                    const isValidAzureNaming = /^[a-z][a-zA-Z0-9]*$/.test(functionName) ||
                        /^Azure[A-Z][a-zA-Z0-9]*$/.test(functionName);

                    if (!isValidAzureNaming) {
                        context.report({
                            messageId: "azureNamingConvention",
                            node: node.id,
                        });
                    }
                }
            }
        };

        return {
            CallExpression: checkSyncOperations,
            VariableDeclarator: checkHardcodedConfig,
            FunctionDeclaration: checkAzureNaming,
        };
    },
});
