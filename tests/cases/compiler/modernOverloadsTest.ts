
type OverloadDefinitions = { readonly [P in number]: (...args: any[]) => any; };
type OverloadKeys<T extends OverloadDefinitions> = Extract<keyof T, number>;
type OverloadParameters<T extends OverloadDefinitions> = Parameters<{ [P in OverloadKeys<T>]: T[P]; }[OverloadKeys<T>]>;
type OverloadBinders<T extends OverloadDefinitions> = { [P in OverloadKeys<T>]: (args: OverloadParameters<T>) => boolean | undefined; };
type OverloadDeprecations<T extends OverloadDefinitions> = { [P in OverloadKeys<T>]?: any; };
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
type OverloadFunction<T extends OverloadDefinitions> = UnionToIntersection<T[keyof T]>;

declare function createOverload<T extends OverloadDefinitions>(name: string, overloads: T, binder: OverloadBinders<T>, deprecations?: OverloadDeprecations<T>): OverloadFunction<T>;
declare function createOverloadDirect<T extends OverloadDefinitions>(name: string, overloads: T, binder: OverloadBinders<T>, deprecations?: OverloadDeprecations<T>): OverloadFunction<T>;

interface OverloadBuilder {
    overload<T extends OverloadDefinitions>(overloads: T): BindableOverloadBuilder<T>;
}

interface BindableOverloadBuilder<T extends OverloadDefinitions> {
    bind(binder: OverloadBinders<T>): BoundOverloadBuilder<T>;
}

interface FinishableOverloadBuilder<T extends OverloadDefinitions> {
    finish(): OverloadFunction<T>;
}

interface BoundOverloadBuilder<T extends OverloadDefinitions> extends FinishableOverloadBuilder<T> {
    deprecate(deprecations: OverloadDeprecations<T>): FinishableOverloadBuilder<T>;
}

declare function buildOverload(name: string): OverloadBuilder;

interface StringFormatter {
    (str: string): string;
    (str: string, uppercase: boolean): string;
    (str: string, uppercase: boolean, trim: boolean): string;
}

const oldFormatter = buildOverload("formatString")
    .overload({
        0: (str: string) => str,
        1: (str: string, uppercase: boolean) => uppercase ? str.toUpperCase() : str,
        2: (str: string, uppercase: boolean, trim: boolean) => {
            let result = uppercase ? str.toUpperCase() : str;
            return trim ? result.trim() : result;
        }
    })
    .bind({
        0: args => args.length === 1,
        1: args => args.length === 2,
        2: args => args.length === 3
    })
    .finish();

const newFormatter = createOverloadDirect(
    "formatString",
    {
        0: (str: string) => str,
        1: (str: string, uppercase: boolean) => uppercase ? str.toUpperCase() : str,
        2: (str: string, uppercase: boolean, trim: boolean) => {
            let result = uppercase ? str.toUpperCase() : str;
            return trim ? result.trim() : result;
        }
    },
    {
        0: args => args.length === 1,
        1: args => args.length === 2,
        2: args => args.length === 3
    }
);

const oldType: StringFormatter = oldFormatter;
const newType: StringFormatter = newFormatter;
