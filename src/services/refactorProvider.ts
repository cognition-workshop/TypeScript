import {
    ApplicableRefactorInfo,
    arrayFrom,
    flatMapIterator,
    InteractiveRefactorArguments,
    Refactor,
    RefactorContext,
    RefactorEditInfo,
} from "./_namespaces/ts.js";
import { refactorKindBeginsWith } from "./_namespaces/ts.refactor.js";

/**
 * Registry of all available refactors indexed by their unique identifier.
 * This map enables efficient lookup and management of refactoring operations
 * for AI code editors and language service integrations.
 * 
 * @example
 * ```typescript
 * // AI editors can query available refactors like:
 * const extractFunctionRefactor = refactors.get("extractFunction");
 * ```
 */
const refactors = new Map<string, Refactor>();

/**
 * Registers a refactor with the TypeScript language service for use by AI code editors.
 * This function enables extensible refactoring capabilities that AI editors can leverage
 * to provide intelligent code transformation suggestions.
 * 
 * @param name - A unique identifier for the refactor. Should be stable across versions
 *               to ensure consistent AI editor integration. Examples: "extractFunction",
 *               "convertToArrowFunction", "moveToNewFile"
 * @param refactor - The refactor implementation containing available actions and edit logic
 * 
 * @example
 * ```typescript
 * // Register a custom refactor for AI editor integration
 * registerRefactor("extractConstant", {
 *   kinds: [RefactorKind.Extract],
 *   getAvailableActions: (context) => [...],
 *   getEditsForAction: (context, actionName) => [...]
 * });
 * ```
 * 
 * @since TypeScript 2.4
 * @internal
 */
export function registerRefactor(name: string, refactor: Refactor): void {
    refactors.set(name, refactor);
}

/**
 * Retrieves all applicable refactoring actions for a given context.
 * This is a core function for AI code editors to discover available
 * code transformations at the current cursor position or selection.
 * 
 * @param context - The refactoring context containing source file, position,
 *                  program information, and user preferences
 * @param includeInteractiveActions - Whether to include refactors that require
 *                                   user interaction (e.g., parameter input dialogs)
 * 
 * @returns Array of applicable refactor information that AI editors can present
 *          to users as quick fix suggestions or code action menu items
 * 
 * @example
 * ```typescript
 * // AI editor usage for showing refactor suggestions
 * const applicableRefactors = getApplicableRefactors({
 *   file: sourceFile,
 *   startPosition: cursorPosition,
 *   endPosition: selectionEnd,
 *   program: languageService.getProgram(),
 *   kind: RefactorKind.Extract
 * }, true);
 * 
 * // Display refactors in AI editor UI
 * applicableRefactors.forEach(refactor => {
 *   console.log(`Available: ${refactor.name} - ${refactor.description}`);
 * });
 * ```
 * 
 * @since TypeScript 2.4
 * @internal
 */
export function getApplicableRefactors(context: RefactorContext, includeInteractiveActions?: boolean): ApplicableRefactorInfo[] {
    return arrayFrom(flatMapIterator(refactors.values(), refactor =>
        context.cancellationToken && context.cancellationToken.isCancellationRequested() ||
            !refactor.kinds?.some(kind => refactorKindBeginsWith(kind, context.kind)) ? undefined :
            refactor.getAvailableActions(context, includeInteractiveActions)));
}

/**
 * Executes a specific refactoring action and returns the resulting code edits.
 * This function is essential for AI code editors to apply automated code
 * transformations based on user selections or AI-driven suggestions.
 * 
 * @param context - The refactoring context with source file and program information
 * @param refactorName - The unique identifier of the refactor to execute
 * @param actionName - The specific action within the refactor to perform
 * @param interactiveRefactorArguments - Optional arguments for interactive refactors
 *                                      that require user input (e.g., new function name)
 * 
 * @returns RefactorEditInfo containing file changes and metadata, or undefined
 *          if the refactor is not applicable or fails validation
 * 
 * @example
 * ```typescript
 * // AI editor applying an extract function refactor
 * const editInfo = getEditsForRefactor(
 *   context,
 *   "extractFunction",
 *   "function_scope_0",
 *   { newFunctionName: "calculateTotal" }
 * );
 * 
 * if (editInfo) {
 *   // Apply edits to the source file
 *   editInfo.edits.forEach(edit => applyTextChanges(edit));
 *   
 *   // Handle any rename operations
 *   if (editInfo.renameLocation) {
 *     showRenameDialog(editInfo.renameLocation);
 *   }
 * }
 * ```
 * 
 * @since TypeScript 2.4
 * @internal
 */
export function getEditsForRefactor(context: RefactorContext, refactorName: string, actionName: string, interactiveRefactorArguments?: InteractiveRefactorArguments): RefactorEditInfo | undefined {
    const refactor = refactors.get(refactorName);
    return refactor && refactor.getEditsForAction(context, actionName, interactiveRefactorArguments);
}
