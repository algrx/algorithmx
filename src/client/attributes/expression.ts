import { AttrSpec, AttrType, AnyRecordSpec, NumSpec, EndpointValueSpec } from './spec';
import { PartialAttr, FullAttr } from './derived';
import { isPrimitive, combineAttrs, nonEmpty, isEndpointSpec } from './utils';
import { AnimSpec, WithAnimSpec } from './components/animation';
import { isNumericalStr, Dict, mapDict, dictValues } from '../utils';

export interface NumExpr<T extends string> {
    readonly m: number;
    readonly x: T;
    readonly c: number;
}

interface ExprTerm {
    readonly num: number;
    readonly symbol?: string;
}
const parseSingleTerm = (term: string): ExprTerm | Error => {
    const reverseVarIndex = term
        .split('')
        .findIndex((c, i) => isNumericalStr(term.substring(0, term.length - i)));
    const varIndex =
        reverseVarIndex === -1
            ? term[0] === '-' || term[0] === '+'
                ? 1
                : 0
            : term.length - reverseVarIndex;
    const rawNumStr = term.substring(0, varIndex);
    const varStr = term.substring(varIndex);
    const numStr =
        rawNumStr === '' && varStr === ''
            ? '0'
            : rawNumStr === '' || rawNumStr === '+'
            ? '1'
            : rawNumStr === '-'
            ? '-1'
            : rawNumStr;
    if (!isNumericalStr(numStr)) return new Error();
    return {
        num: parseFloat(numStr),
        ...(varStr !== '' ? ({ symbol: varStr } as Partial<ExprTerm>) : {}),
    };
};

const validateExpr = <T extends string>(
    expr: NumExpr<string>,
    validVars: ReadonlyArray<T>,
    originalExprStr?: string
): NumExpr<T> | Error => {
    if (!validVars.includes(expr.x as T)) {
        const formattedExpr = originalExprStr || JSON.stringify(expr);
        return new Error(
            `expression '${formattedExpr}' uses invalid variable '${expr.x}'` +
                ` (valid variables are [${validVars}])`
        );
    }
    return expr as NumExpr<T>;
};

export const parseExprObj = <T extends string>(
    rawValue: object,
    validVars: ReadonlyArray<T>
): NumExpr<T> | Error => {
    const partialExpr = rawValue as Partial<NumExpr<string>>;

    if (
        (partialExpr.m !== undefined && typeof partialExpr.m !== 'number') ||
        (partialExpr.c !== undefined && typeof partialExpr.c !== 'number') ||
        partialExpr.x === undefined
    )
        return new Error(`invalid expression '${JSON.stringify(rawValue)}'`);

    const expr: NumExpr<string> = {
        m: partialExpr.m !== undefined ? partialExpr.m : 1,
        x: partialExpr.x,
        c: partialExpr.c !== undefined ? partialExpr.c : 0,
    };
    return validateExpr(expr, validVars);
};

export const parseExprStr = <T extends string>(
    rawValue: string,
    validVars: ReadonlyArray<T>
): NumExpr<T> | Error => {
    // e.g. parse '4.7r - 9' to { m: 4.7, x: 'r', c: -9 }
    const errorText = `invalid expression '${rawValue}'`;

    const expression = rawValue.replace(/\s/g, ''); // remove whitespace
    const opIndex =
        expression.lastIndexOf('+') > 0
            ? expression.lastIndexOf('+')
            : expression.lastIndexOf('-') > 0
            ? expression.lastIndexOf('-')
            : expression.length;

    const term1 = parseSingleTerm(expression.substring(0, opIndex));
    const term2 = parseSingleTerm(expression.substring(opIndex));

    if (term1 instanceof Error) return new Error(errorText);
    if (term2 instanceof Error) return new Error(errorText);
    if (term1.symbol !== undefined && term2.symbol !== undefined)
        return new Error(`${errorText}: too many variables`);
    if (term1.symbol === undefined && term2.symbol === undefined)
        return new Error(`${errorText}: not enough variables`);

    const expr: NumExpr<string> =
        term1.symbol !== undefined
            ? { m: term1.num, x: term1.symbol, c: term2.num }
            : { m: term2.num, x: term2.symbol!, c: term1.num };

    return validateExpr(expr, validVars, rawValue);
};

const isNumExpr = (attr: {} | number): attr is NumExpr<string> => {
    return typeof attr === 'object';
};

export const isExpr = <T extends AttrSpec>(spec: T, attr: PartialAttr<T>) => {
    return spec.type === AttrType.Number && isNumExpr(attr);
};

export const evalNum = <T extends string>(
    expr: NumExpr<T> | number,
    vars: { readonly [k in T]: number }
): number => {
    // e.g. expressionDict = { value: 8, units: 'x' }, units = { x: 5 } => return 16
    if (typeof expr !== 'object') return expr;
    const m = expr.m !== undefined ? expr.m : 1;
    const c = expr.c !== undefined ? expr.c : 0;

    if (expr.x === undefined) return m + c;
    else if (expr.x in vars) return m * (vars[expr.x] as number) + c;
    else return 0;
};

export const usesVars = (expr: NumExpr<string> | number, vars: ReadonlyArray<string>): boolean => {
    if (isNumExpr(expr)) return vars.includes(expr.x);
    return false;
};

interface VarInfo {
    readonly attr: PartialAttr<AnimSpec> & { readonly value: number };
    readonly changed: boolean;
}
export type VarDict<V extends string> = Dict<V, VarInfo>;

export const evalAnimAttr = <T extends PartialAttr<WithAnimSpec<EndpointValueSpec>>>(
    vars: VarDict<string>,
    // at least one of prevAttr, change should be defined
    prevAttr: T | undefined,
    change: T | undefined,
    valueFn: (v: NonNullable<T['value']>) => NumExpr<string> | number = (v) =>
        v as NumExpr<string> | number
): VarInfo => {
    const varValues = mapDict(vars, (v) => v.attr.value);

    if (change?.value !== undefined) {
        const value = valueFn(change.value as NonNullable<T['value']>);

        // note that if the change is self-referential (e.g. node.size = 2x), the variable won't exist yet
        if (!isNumExpr(value) || value.x in vars) {
            return {
                attr: {
                    ...change,
                    value: evalNum(value, varValues),
                },
                changed: true,
            };
        }
    }

    if (prevAttr?.value !== undefined && isNumExpr(prevAttr)) {
        const value = valueFn(prevAttr.value as NonNullable<T['value']>);
        return {
            attr: {
                ...vars[prevAttr.x]?.attr,
                value: evalNum(value, varValues),
            },
            changed: false,
        };
    }

    return { attr: { value: 0 }, changed: false };
};

const evalDeepAux = <T extends AttrSpec, V extends string>(
    spec: T,
    prevExprs: PartialAttr<T> | undefined,
    changes: PartialAttr<T> | undefined,
    vars: VarDict<V>
): PartialAttr<T> | undefined => {
    if (changes !== undefined && spec.type === AttrType.Number && isNumExpr(changes)) {
        // evaluate a changed expression
        const varValues = mapDict(vars, (v) => v.attr.value);
        return evalNum(changes, varValues) as PartialAttr<T>;
    }

    if (prevExprs !== undefined) {
        // evaluate an existing animation
        const exprValue = isEndpointSpec(spec)
            ? (prevExprs as PartialAttr<WithAnimSpec<NumSpec>>).value
            : prevExprs;

        if (
            exprValue &&
            isNumExpr(exprValue) &&
            exprValue.x in vars &&
            vars[exprValue.x as V]!.changed
        ) {
            const evalValue = evalNum(
                exprValue,
                mapDict(vars, (v) => v.attr.value)
            );

            return isEndpointSpec(spec)
                ? (({ ...vars[exprValue.x as V].attr, value: evalValue } as unknown) as PartialAttr<
                      T
                  >)
                : (evalValue as PartialAttr<T>);
        }
    }

    // simply return the changes
    if (isPrimitive(spec)) {
        return changes;
    }

    // evaluate all children
    return nonEmpty(
        combineAttrs(spec, prevExprs, changes, (v1, v2, k, s) => {
            return evalDeepAux(s, v1, v2, vars);
        })
    );
};

export const evalDeep = <T extends AttrSpec, V extends string>(
    spec: T,
    permExpr: PartialAttr<T> | undefined, // attributes containing 'permanent' expressions
    changes: PartialAttr<T> | undefined,
    vars: VarDict<V>
): PartialAttr<T> | undefined => {
    // optimisation: stop evaluating if there are no changed attributes or changed variables
    if (!changes && dictValues(vars).every((v) => !v.changed)) return changes;

    return evalDeepAux(spec, permExpr, changes, vars) ?? changes;
};

export type EvalChangesFn<T extends AttrSpec, V extends string> = (args: {
    readonly prevAttrs: FullAttr<T> | undefined;
    readonly prevExprs: PartialAttr<T>;
    readonly changes: PartialAttr<T>;
    readonly selfRefOnly: boolean;
    readonly parentVars: VarDict<V>;
}) => PartialAttr<T>;
