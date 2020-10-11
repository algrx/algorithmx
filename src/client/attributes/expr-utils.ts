import { NumExpr } from './components/expression';
import { isNumericalStr, Dict, mapDict, dictValues } from '../utils';
import { AttrSpec, AttrType } from './spec';
import { PartialAttr } from './derived';
import { isPrimitive, combineAttrs } from './attr-utils';

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

export const isNumExpr = (attr: {} | number): attr is NumExpr<string> => {
    return typeof attr === 'object';
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
    if (isNumExpr(expr)) return expr.x in vars;
    return false;
};

export type VarDict<V extends string> = Dict<
    V,
    { readonly value: number; readonly changed: boolean }
>;

export const evalAttr = (
    attr: NumExpr<string> | number | undefined,
    changes: NumExpr<string> | number | undefined,
    vars: VarDict<string>
): { readonly value: number; readonly changed: boolean } => {
    const varValues = mapDict(vars, (v) => v.value);

    if (changes) {
        // if the change is self-referential (e.g. node.size = 2x), the variable won't exist yet
        if (isNumExpr(changes) && changes.x in vars)
            return { value: evalNum(changes, varValues), changed: true };
    }

    return { value: evalNum(attr!, varValues), changed: false };
};

const evalDeepAux = <T extends AttrSpec, V extends string>(
    spec: T,
    permExpr: PartialAttr<T> | undefined,
    changes: PartialAttr<T> | undefined,
    vars: VarDict<V>
): PartialAttr<T> | undefined => {
    if (spec.type === AttrType.Number) {
        const varValues = mapDict(vars, (v) => v.value);

        // evaluate a changed expression
        if (changes && isNumExpr(changes)) {
            return evalNum(changes, varValues) as PartialAttr<T>;
        }

        // evaluate an existing 'permanent' expression
        if (permExpr && isNumExpr(permExpr)) {
            // only evaluate if the variable has changed
            if (permExpr.x in vars && vars[permExpr.x as V]!.changed)
                return evalNum(permExpr, varValues) as PartialAttr<T>;
        }
    }

    // simply return the changes
    if (isPrimitive(spec)) {
        return changes;
    }

    // evaluate all children
    const children = combineAttrs(spec, permExpr, changes, (v1, v2, k, s) => {
        return evalDeepAux(s, v1, v2, vars);
    });
    return children === {} ? undefined : children;
};

export const evalDeep = <T extends AttrSpec, V extends string>(
    spec: T,
    permExpr: PartialAttr<T> | undefined, // attributes containing 'permanent' expressions
    changes: PartialAttr<T> | undefined,
    vars: VarDict<V>
): PartialAttr<T> | undefined => {
    // optimisation: stop evaluating if there are no changed attributes or changed variables
    if (!changes && dictValues(vars).every((v) => !v.changed)) return changes;

    return evalDeepAux(spec, permExpr, changes, vars);
};
