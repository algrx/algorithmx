import {
    AttrType,
    PrimitiveSpec,
    StringSpec,
    AttrSpec,
    AttrKey,
    EntrySpec,
    AnyRecordSpec,
    AnyDictSpec,
    ExactStringSpec,
} from './attr-spec';
import { InputAttr, PartialAttr } from './derived-attr';
import { parseExprStr, parseExprObj } from './expr-utils';
import { getEntrySpec, getAttrEntry, mapAttr } from './attr-utils';
import { mapDict, dictFromArray } from '../utils';

interface PreprocessInfo {
    readonly validVars: ReadonlyArray<string>;
    readonly path: ReadonlyArray<[string, AttrType]>;
}

const formatPath = (path: PreprocessInfo['path']): string => {
    return path.reduce((result: string, [name, type], i) => {
        if (i > 0) {
            const prevType = path[i - 1][1];
            return (
                result +
                (prevType === AttrType.Array || prevType === AttrType.Tuple
                    ? `[${name}]`
                    : `.${name}`)
            );
        } else return name;
    }, '');
};

const defaultValue = <T extends AttrSpec>(spec: T): PartialAttr<T> | undefined => {
    if (spec.type === AttrType.String) return '' as PartialAttr<T>;
    if (spec.type === AttrType.Record) return {} as PartialAttr<T>;
    return undefined;
};

const preprocessCompound = <T extends AttrSpec>(
    spec: T,
    info: PreprocessInfo,
    attr: InputAttr<T>
): PartialAttr<T> | Error => {
    const newAttr = mapAttr(spec, attr as PartialAttr<T>, (childAttr, childKey, childSpec) => {
        const newInfo = {
            ...info,
            path: info.path.concat([String(childKey), childSpec.type]),
        };
        return preprocess(childSpec, newInfo, childAttr as InputAttr<EntrySpec<T>>) as PartialAttr<
            EntrySpec<T>
        >;
    });

    const error = Object.values(newAttr).find((v) => v instanceof Error);
    if (error !== undefined) return error;

    return newAttr;
};

export const preprocess = <T extends AttrSpec>(
    spec: T,
    info: PreprocessInfo,
    attr: InputAttr<T>
): PartialAttr<T> | Error => {
    // === boolean ===
    if (spec.type === AttrType.Boolean) {
        if (typeof attr === 'boolean') return attr as PartialAttr<T>;
        return new Error(`attribute '${formatPath(info.path)}' must be a boolean`);
    }

    // === number ===
    if (spec.type === AttrType.Number) {
        if (typeof attr === 'number') return attr as PartialAttr<T>;
        else if (typeof attr === 'string')
            return parseExprStr(attr, info.validVars) as PartialAttr<T>;
        else if (typeof attr === 'object')
            return parseExprObj(attr as {}, info.validVars) as PartialAttr<T>;
        return new Error(`attribute '${formatPath(info.path)}' must be a number`);
    }

    // === string ===
    if (spec.type === AttrType.String) {
        const exactStringSpec = spec as ExactStringSpec<string>;
        if (exactStringSpec.validValues && !exactStringSpec.validValues.includes(attr as string)) {
            return new Error(
                `attribute '${formatPath(info.path)}' has invalid value '${attr}'` +
                    ` (valid values are [${exactStringSpec.validValues}])`
            );
        }
        if (typeof attr === 'string') return attr as PartialAttr<T>;
        else if (typeof attr === 'number') return String(attr) as PartialAttr<T>;
        return new Error(`attribute '${formatPath(info.path)}' must be a string`);
    }

    // === tuple ===
    if (spec.type === AttrType.Tuple) {
        // single values will automatically be repeated twice
        if (!Array.isArray(attr))
            return preprocess(spec, info, ([attr, attr] as unknown) as InputAttr<T>);

        if (attr.length !== 2)
            return new Error(
                `attribute '${formatPath(info.path)}' must be a tuple with exactly 2 items`
            );

        return preprocessCompound(spec, info, attr);
    }

    // === record ===
    if (spec.type === AttrType.Record) {
        if (typeof attr !== 'object')
            return new Error(`attribute '${formatPath(info.path)}' must be an object`);

        const invalidKey = Object.keys(attr).find((k) => !(k in (spec as AnyRecordSpec).entries));
        if (invalidKey)
            return new Error(
                `attribute '${formatPath(info.path)}' has invalid key '${invalidKey}'`
            );

        const newInfo = {
            ...info,
            validVars: (spec as AnyRecordSpec).validVars ?? info.validVars,
        };
        return preprocessCompound(spec, newInfo, attr);
    }

    // === array ===
    if (spec.type === AttrType.Array) {
        if (!Array.isArray(attr))
            return new Error(`attribute '${formatPath(info.path)}' must be an array`);

        return preprocessCompound(spec, info, attr);
    }

    // === dict ===
    if (spec.type === AttrType.Dict) {
        // allow dicts to be given as arrays, when just the keys are needed
        if (Array.isArray(attr)) {
            const dict = dictFromArray(attr, (k) =>
                defaultValue((spec as AnyDictSpec).entry)
            ) as InputAttr<T>;
            return preprocess(spec, info, dict);
        }

        if (typeof attr !== 'object')
            return new Error(`attribute '${formatPath(info.path)}' must be an object`);

        return preprocessCompound(spec, info, attr);
    }

    return new Error();
};
