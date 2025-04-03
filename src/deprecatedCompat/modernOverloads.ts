import {
    hasProperty,
    UnionToIntersection,
    Version,
} from "./_namespaces/ts.js";
import { deprecate } from "./deprecate.js";
import { 
    DeprecationOptions,
    OverloadDefinitions, 
    OverloadKeys, 
    OverloadParameters,
    OverloadFunction,
    OverloadBinders,
    OverloadDeprecations,
    createOverload
} from "./deprecations.js";

/**
 * Creates an overloaded function directly without using the builder pattern.
 * This is a modern alternative to buildOverload that takes advantage of
 * improved type inference in TypeScript 5.9+.
 * 
 * @example
 * // Old approach using builder pattern:
 * const oldOverload = buildOverload("myFunction")
 *   .overload({
 *     0: (a: string) => a.length,
 *     1: (a: number) => a.toString()
 *   })
 *   .bind({
 *     0: args => typeof args[0] === "string",
 *     1: args => typeof args[0] === "number"
 *   })
 *   .finish();
 * 
 * // New approach using direct function:
 * const newOverload = createOverloadDirect(
 *   "myFunction",
 *   {
 *     0: (a: string) => a.length,
 *     1: (a: number) => a.toString()
 *   },
 *   {
 *     0: args => typeof args[0] === "string",
 *     1: args => typeof args[0] === "number"
 *   }
 * );
 * 
 * @internal @knipignore
 */
export function createOverloadDirect<T extends OverloadDefinitions>(
    name: string, 
    overloads: T, 
    binder: OverloadBinders<T>, 
    deprecations?: OverloadDeprecations<T>
): OverloadFunction<T> {
    return createOverload(name, overloads, binder, deprecations);
}
