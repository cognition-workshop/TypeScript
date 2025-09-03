import {
    DiagnosticMessage,
    DiagnosticWithLocation,
    Node,
    SourceFile,
} from "./_namespaces/ts.js";

import {
    createDiagnosticForNodeInSourceFile,
    getSourceFileOfNode,
} from "./utilities.js";

export function createEnterpriseDiagnostic(
    node: Node,
    message: DiagnosticMessage,
    severity: "error" | "warning" | "info",
    context?: string,
    ...args: (string | number | undefined)[]
): DiagnosticWithLocation {
    const sourceFile = getSourceFileOfNode(node);
    const filteredArgs = args.filter((arg): arg is string | number => arg !== undefined);
    const diagnostic = createDiagnosticForNodeInSourceFile(sourceFile, node, message, ...filteredArgs);
    
    if (context) {
        diagnostic.messageText = `[${context}] ${diagnostic.messageText}`;
    }
    
    return diagnostic;
}

export function createAzureCompatibilityDiagnostic(
    node: Node,
    message: DiagnosticMessage,
    azureService?: string,
    ...args: (string | number | undefined)[]
): DiagnosticWithLocation {
    const context = azureService ? `Azure ${azureService}` : "Azure Compatibility";
    return createEnterpriseDiagnostic(node, message, "warning", context, ...args);
}

export function createEnterpriseErrorHandlingDiagnostic(
    node: Node,
    message: DiagnosticMessage,
    errorType?: string,
    ...args: (string | number | undefined)[]
): DiagnosticWithLocation {
    const context = errorType ? `Error Handling - ${errorType}` : "Error Handling";
    return createEnterpriseDiagnostic(node, message, "error", context, ...args);
}
