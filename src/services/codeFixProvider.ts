import {
    arrayFrom,
    cast,
    CodeActionCommand,
    CodeFixAction,
    CodeFixAllContext,
    CodeFixContext,
    CodeFixContextBase,
    CodeFixRegistration,
    CombinedCodeActions,
    computeSuggestionDiagnostics,
    contains,
    createMultiMap,
    Debug,
    Diagnostic,
    DiagnosticOrDiagnosticAndArguments,
    diagnosticToString,
    DiagnosticWithLocation,
    FileTextChanges,
    flatMap,
    getEmitDeclarations,
    isString,
    map,
    TextChange,
    textChanges,
} from "./_namespaces/ts.js";

/**
 * Registry mapping error codes to their corresponding code fix implementations.
 * This enables AI code editors to provide contextual quick fixes based on
 * TypeScript compiler diagnostics and language service errors.
 */
const errorCodeToFixes = createMultiMap<string, CodeFixRegistration>();

/**
 * Registry mapping fix IDs to their registration information for batch operations.
 * Used by AI editors to apply consistent fixes across multiple files or locations.
 */
const fixIdToRegistration = new Map<string, CodeFixRegistration>();

/**
 * Creates a code fix action without "fix all" capability for single-instance fixes.
 * This is ideal for AI editors providing targeted, one-off code corrections that
 * don't need to be applied across multiple locations.
 * 
 * @param fixName - Unique identifier for the fix (e.g., "addMissingImport", "fixTypo")
 * @param changes - Array of file text changes to apply the fix
 * @param description - Human-readable description or diagnostic message for the fix
 * 
 * @returns CodeFixAction that AI editors can present as a quick fix option
 * 
 * @example
 * ```typescript
 * // AI editor creating a single-instance import fix
 * const importFix = createCodeFixActionWithoutFixAll(
 *   "addMissingImport",
 *   [{ fileName: "app.ts", textChanges: [importChange] }],
 *   Diagnostics.Cannot_find_name_0_Did_you_mean_1
 * );
 * ```
 * 
 * @since TypeScript 2.1
 * @internal
 */
export function createCodeFixActionWithoutFixAll(fixName: string, changes: FileTextChanges[], description: DiagnosticOrDiagnosticAndArguments): CodeFixAction {
    return createCodeFixActionWorker(fixName, diagnosticToString(description), changes, /*fixId*/ undefined, /*fixAllDescription*/ undefined);
}

/**
 * Creates a comprehensive code fix action with "fix all" capability for batch operations.
 * Essential for AI editors that need to apply consistent fixes across multiple files
 * or locations, improving developer productivity through bulk corrections.
 * 
 * @param fixName - Unique identifier for the fix type
 * @param changes - Array of file text changes for the immediate fix
 * @param description - Description of the individual fix action
 * @param fixId - Identifier for grouping related fixes for batch operations
 * @param fixAllDescription - Description for the "fix all" batch operation
 * @param command - Optional command to execute alongside the fix
 * 
 * @returns CodeFixAction with both individual and batch fix capabilities
 * 
 * @example
 * ```typescript
 * // AI editor creating a fix with batch capability
 * const unusedImportFix = createCodeFixAction(
 *   "removeUnusedImport",
 *   [{ fileName: "app.ts", textChanges: [removeImportChange] }],
 *   Diagnostics._0_is_declared_but_its_value_is_never_read,
 *   "unusedImports",
 *   Diagnostics.Remove_all_unused_imports,
 *   { type: "organizeImports" }
 * );
 * ```
 * 
 * @since TypeScript 2.8
 * @internal
 */
export function createCodeFixAction(fixName: string, changes: FileTextChanges[], description: DiagnosticOrDiagnosticAndArguments, fixId: {}, fixAllDescription: DiagnosticOrDiagnosticAndArguments, command?: CodeActionCommand): CodeFixAction {
    return createCodeFixActionWorker(fixName, diagnosticToString(description), changes, fixId, diagnosticToString(fixAllDescription), command);
}

/**
 * Creates a code fix action with optional "fix all" capability based on context.
 * Provides flexibility for AI editors to conditionally offer batch operations
 * depending on the scope and nature of the detected issues.
 * 
 * @param fixName - Unique identifier for the fix type
 * @param changes - Array of file text changes for the fix
 * @param description - Description of the fix action
 * @param fixId - Optional identifier for batch operations
 * @param fixAllDescription - Optional description for batch operations
 * @param command - Optional command to execute with the fix
 * 
 * @returns CodeFixAction with conditional batch fix capability
 * 
 * @example
 * ```typescript
 * // AI editor creating conditional batch fix
 * const typeAnnotationFix = createCodeFixActionMaybeFixAll(
 *   "addTypeAnnotation",
 *   [{ fileName: "app.ts", textChanges: [typeChange] }],
 *   Diagnostics.Parameter_0_implicitly_has_an_any_type,
 *   hasMultipleInstances ? "addMissingTypes" : undefined,
 *   hasMultipleInstances ? Diagnostics.Add_missing_type_annotations : undefined
 * );
 * ```
 * 
 * @since TypeScript 3.7
 * @internal
 */
export function createCodeFixActionMaybeFixAll(fixName: string, changes: FileTextChanges[], description: DiagnosticOrDiagnosticAndArguments, fixId?: {}, fixAllDescription?: DiagnosticOrDiagnosticAndArguments, command?: CodeActionCommand): CodeFixAction {
    return createCodeFixActionWorker(fixName, diagnosticToString(description), changes, fixId, fixAllDescription && diagnosticToString(fixAllDescription), command);
}

/**
 * Internal worker function that constructs CodeFixAction objects with proper structure.
 * Centralizes the creation logic to ensure consistency across all code fix types.
 * 
 * @param fixName - Unique identifier for the fix
 * @param description - Human-readable description of the fix
 * @param changes - File text changes to apply
 * @param fixId - Optional identifier for batch operations
 * @param fixAllDescription - Optional description for batch operations
 * @param command - Optional command to execute with the fix
 * 
 * @returns Properly structured CodeFixAction object
 */
function createCodeFixActionWorker(fixName: string, description: string, changes: FileTextChanges[], fixId?: {}, fixAllDescription?: string, command?: CodeActionCommand): CodeFixAction {
    return { fixName, description, changes, fixId, fixAllDescription, commands: command ? [command] : undefined };
}

/**
 * Registers a code fix provider with the TypeScript language service.
 * This enables AI code editors to discover and apply automated fixes for
 * specific error codes and diagnostic messages.
 * 
 * @param reg - Registration object containing error codes, fix logic, and metadata
 * 
 * @example
 * ```typescript
 * // Register a custom code fix for AI editor integration
 * registerCodeFix({
 *   errorCodes: [2304], // "Cannot find name" error
 *   getCodeActions: (context) => {
 *     // Return array of possible fixes
 *     return [createImportFix(context), createDeclarationFix(context)];
 *   },
 *   fixIds: ["addMissingImport"],
 *   getAllCodeActions: (context) => {
 *     // Batch fix implementation
 *     return combineAllImportFixes(context);
 *   }
 * });
 * ```
 * 
 * @since TypeScript 2.1
 * @internal
 */
export function registerCodeFix(reg: CodeFixRegistration): void {
    for (const error of reg.errorCodes) {
        errorCodeToFixesArray = undefined;
        errorCodeToFixes.add(String(error), reg);
    }
    if (reg.fixIds) {
        for (const fixId of reg.fixIds) {
            Debug.assert(!fixIdToRegistration.has(fixId));
            fixIdToRegistration.set(fixId, reg);
        }
    }
}

/**
 * Cached array of supported error codes for efficient lookup.
 * Invalidated when new code fixes are registered.
 */
let errorCodeToFixesArray: readonly string[] | undefined;

/**
 * Retrieves all error codes that have registered code fix providers.
 * Used by AI code editors to determine which diagnostics can be automatically
 * resolved through quick fixes and code actions.
 * 
 * @returns Array of error code strings that have available fixes
 * 
 * @example
 * ```typescript
 * // AI editor checking for fixable errors
 * const supportedCodes = getSupportedErrorCodes();
 * const fixableErrors = diagnostics.filter(d => 
 *   supportedCodes.includes(String(d.code))
 * );
 * 
 * // Show quick fix indicators for fixable errors
 * fixableErrors.forEach(error => showQuickFixIcon(error));
 * ```
 * 
 * @since TypeScript 2.1
 * @internal
 */
export function getSupportedErrorCodes(): readonly string[] {
    return errorCodeToFixesArray ??= arrayFrom(errorCodeToFixes.keys());
}

function removeFixIdIfFixAllUnavailable(registration: CodeFixRegistration, diagnostics: readonly Diagnostic[]) {
    const { errorCodes } = registration;
    let maybeFixableDiagnostics = 0;
    for (const diag of diagnostics) {
        if (contains(errorCodes, diag.code)) maybeFixableDiagnostics++;
        if (maybeFixableDiagnostics > 1) break;
    }

    const fixAllUnavailable = maybeFixableDiagnostics < 2;
    return ({ fixId, fixAllDescription, ...action }: CodeFixAction): CodeFixAction => {
        return fixAllUnavailable ? action : { ...action, fixId, fixAllDescription };
    };
}

/**
 * Retrieves all available code fixes for a specific error in the given context.
 * This is the primary function AI code editors use to discover quick fix options
 * when users encounter TypeScript errors or request code actions.
 * 
 * @param context - Code fix context containing error information, source file, and program
 * 
 * @returns Array of applicable code fix actions that can resolve the error
 * 
 * @example
 * ```typescript
 * // AI editor requesting fixes for a specific error
 * const fixes = getFixes({
 *   errorCode: 2304, // "Cannot find name"
 *   sourceFile: currentFile,
 *   span: { start: errorStart, length: errorLength },
 *   program: languageService.getProgram(),
 *   host: languageServiceHost,
 *   formatContext: getFormatContext(),
 *   preferences: userPreferences
 * });
 * 
 * // Present fixes to user in AI editor UI
 * fixes.forEach(fix => {
 *   addQuickFixOption(fix.description, () => applyFix(fix));
 * });
 * ```
 * 
 * @since TypeScript 2.1
 * @internal
 */
export function getFixes(context: CodeFixContext): readonly CodeFixAction[] {
    const diagnostics = getDiagnostics(context);
    const registrations = errorCodeToFixes.get(String(context.errorCode));
    return flatMap(registrations, f => map(f.getCodeActions(context), removeFixIdIfFixAllUnavailable(f, diagnostics)));
}

/**
 * Executes a batch "fix all" operation for a specific fix type across the codebase.
 * Essential for AI code editors to provide efficient bulk corrections that improve
 * code quality across multiple files simultaneously.
 * 
 * @param context - Batch fix context with fix ID and scope information
 * 
 * @returns Combined code actions containing all file changes and commands
 * 
 * @example
 * ```typescript
 * // AI editor applying "fix all unused imports" across project
 * const batchFix = getAllFixes({
 *   fixId: "unusedImports",
 *   sourceFile: currentFile,
 *   program: languageService.getProgram(),
 *   host: languageServiceHost,
 *   formatContext: getFormatContext(),
 *   preferences: userPreferences
 * });
 * 
 * // Apply all changes atomically
 * batchFix.changes.forEach(fileChange => applyFileChanges(fileChange));
 * batchFix.commands?.forEach(command => executeCommand(command));
 * ```
 * 
 * @since TypeScript 2.8
 * @internal
 */
export function getAllFixes(context: CodeFixAllContext): CombinedCodeActions {
    return fixIdToRegistration.get(cast(context.fixId, isString))!.getAllCodeActions!(context);
}

/**
 * Creates a combined code actions object for batch operations.
 * Used internally to structure the results of "fix all" operations
 * in a format that AI code editors can efficiently process.
 * 
 * @param changes - Array of file text changes to apply
 * @param commands - Optional array of additional commands to execute
 * 
 * @returns Structured combined code actions object
 * 
 * @since TypeScript 2.8
 * @internal
 */
export function createCombinedCodeActions(changes: FileTextChanges[], commands?: CodeActionCommand[]): CombinedCodeActions {
    return { changes, commands };
}

/**
 * Creates a file text changes object for a specific file.
 * Utility function for structuring code fix results in the format
 * expected by AI code editors and language service clients.
 * 
 * @param fileName - Path to the file being modified
 * @param textChanges - Array of text changes to apply to the file
 * 
 * @returns Structured file text changes object
 * 
 * @since TypeScript 2.1
 * @internal
 */
export function createFileTextChanges(fileName: string, textChanges: TextChange[]): FileTextChanges {
    return { fileName, textChanges };
}

/**
 * Generic helper for implementing "fix all" operations across multiple diagnostics.
 * Provides a consistent pattern for AI code editors to batch-process related errors
 * with a single user action, significantly improving developer productivity.
 * 
 * @param context - Batch fix context with program and formatting information
 * @param errorCodes - Array of error codes to process in the batch operation
 * @param use - Callback function to apply fixes for each matching diagnostic
 * 
 * @returns Combined code actions with all changes and commands
 * 
 * @example
 * ```typescript
 * // Implement a custom "fix all" for missing return types
 * const fixAllMissingReturnTypes = (context: CodeFixAllContext) => 
 *   codeFixAll(context, [7030], (changes, diagnostic, commands) => {
 *     const returnType = inferReturnType(diagnostic);
 *     changes.insertText(diagnostic.file, diagnostic.start, `: ${returnType}`);
 *   });
 * ```
 * 
 * @since TypeScript 2.8
 * @internal
 */
export function codeFixAll(
    context: CodeFixAllContext,
    errorCodes: number[],
    use: (changes: textChanges.ChangeTracker, error: DiagnosticWithLocation, commands: CodeActionCommand[]) => void,
): CombinedCodeActions {
    const commands: CodeActionCommand[] = [];
    const changes = textChanges.ChangeTracker.with(context, t => eachDiagnostic(context, errorCodes, diag => use(t, diag, commands)));
    return createCombinedCodeActions(changes, commands.length === 0 ? undefined : commands);
}

/**
 * Iterates over all diagnostics in the context that match the specified error codes.
 * Used by batch fix operations to process multiple related errors efficiently.
 * 
 * @param context - Batch fix context containing diagnostics and program information
 * @param errorCodes - Array of error codes to match against diagnostics
 * @param cb - Callback function to execute for each matching diagnostic
 * 
 * @example
 * ```typescript
 * // Process all "unused variable" errors in a file
 * eachDiagnostic(context, [6133], (diagnostic) => {
 *   const variableName = getVariableName(diagnostic);
 *   console.log(`Removing unused variable: ${variableName}`);
 *   removeUnusedVariable(diagnostic);
 * });
 * ```
 * 
 * @since TypeScript 2.8
 * @internal
 */
export function eachDiagnostic(context: CodeFixAllContext, errorCodes: readonly number[], cb: (diag: DiagnosticWithLocation) => void): void {
    for (const diag of getDiagnostics(context)) {
        if (contains(errorCodes, diag.code)) {
            cb(diag as DiagnosticWithLocation);
        }
    }
}

/**
 * Retrieves all relevant diagnostics for code fix operations from the TypeScript program.
 * Combines semantic, syntactic, suggestion, and declaration diagnostics to provide
 * comprehensive error information for AI code editors to process.
 * 
 * @param context - Base context containing program, source file, and cancellation token
 * 
 * @returns Array of all diagnostics that code fixes can potentially address
 * 
 * @example
 * ```typescript
 * // AI editor gathering all fixable issues in a file
 * const allDiagnostics = getDiagnostics({
 *   program: languageService.getProgram(),
 *   sourceFile: currentFile,
 *   cancellationToken: CancellationToken.None
 * });
 * 
 * // Categorize diagnostics for different AI editor features
 * const errors = allDiagnostics.filter(d => d.category === DiagnosticCategory.Error);
 * const suggestions = allDiagnostics.filter(d => d.category === DiagnosticCategory.Suggestion);
 * ```
 * 
 * @since TypeScript 2.1
 */
function getDiagnostics({ program, sourceFile, cancellationToken }: CodeFixContextBase): readonly Diagnostic[] {
    const diagnostics = [
        ...program.getSemanticDiagnostics(sourceFile, cancellationToken),
        ...program.getSyntacticDiagnostics(sourceFile, cancellationToken),
        ...computeSuggestionDiagnostics(sourceFile, program, cancellationToken),
    ];
    if (getEmitDeclarations(program.getCompilerOptions())) {
        diagnostics.push(
            ...program.getDeclarationDiagnostics(sourceFile, cancellationToken),
        );
    }
    return diagnostics;
}
