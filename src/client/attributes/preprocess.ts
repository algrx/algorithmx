import { AttrType, AnyAttrDef, RecordAttrDef, LookupAttrDef, ArrayAttrDef } from './definitions';
import {
    AttrPrimitive,
    Attr,
    PartialAttr,
    AttrRecord,
    AttrLookup,
    VarSymbol,
    AttrArray,
} from './types';
import * as expressions from './expressions';
import * as attrUtils from './utils';
import * as utils from '../utils';

interface PreProcessInfo {
    readonly variables: ReadonlyArray<VarSymbol>;
    readonly path: ReadonlyArray<[string, AttrType]>;
}

export const initInfo = (): PreProcessInfo => ({
    variables: [],
    path: [['canvas', AttrType.Record]],
});

const formatPath = (path: PreProcessInfo['path']): string => {
    return path.reduce((result: string, [name, type], i) => {
        if (i > 0) {
            const prevType = path[i - 1][1];
            return result + (prevType === AttrType.Array ? `${[name]}` : `.${name}`);
        } else return name;
    }, '');
};

export const preprocess = <T extends Attr>(
    attr: unknown,
    definition: AnyAttrDef<T>,
    info?: PreProcessInfo
): PartialAttr<T> | Error => {
    const newInfo = info || initInfo();
    const fullInfo: PreProcessInfo = {
        ...newInfo,
        variables: newInfo.variables.concat(definition.validVars || []),
    };

    if (attrUtils.isDefPrimitive(definition))
        return preprocessPrimitive(attr, definition as AnyAttrDef<AttrPrimitive>, fullInfo) as
            | PartialAttr<T>
            | Error;
    else if (attrUtils.isDefRecord(definition))
        return preprocessRecord(attr, definition as RecordAttrDef<T>, fullInfo);
    else if (attrUtils.isDefLookup(definition))
        return preprocessLookup(attr, definition as LookupAttrDef<Attr>, fullInfo) as
            | PartialAttr<T>
            | Error;
    else if (attrUtils.isDefArray(definition))
        return preprocessArray(attr, definition as ArrayAttrDef<Attr>, fullInfo) as
            | PartialAttr<T>
            | Error;
    else return new Error();
};

const preprocessPrimitive = (
    attr: unknown,
    def: AnyAttrDef<AttrPrimitive>,
    info: PreProcessInfo
): AttrPrimitive | Error => {
    if (def.validValues && !def.validValues.includes(attr as AttrPrimitive)) {
        return new Error(
            `attribute '${formatPath(info.path)}' has invalid value '${attr}'` +
                ` (valid values are [${def.validValues}])`
        );
    } else {
        switch (def.type) {
            case AttrType.Number:
                if (typeof attr === 'number') return attr;
                else if (typeof attr === 'string')
                    return expressions.parseExprStr(attr, info.variables);
                else if (utils.isDict(attr)) return expressions.parseExprObj(attr, info.variables);
                else return new Error(`attribute '${formatPath(info.path)}' must be a number`);

            case AttrType.String:
                if (typeof attr === 'string') return attr;
                else if (typeof attr === 'number') return String(attr);
                else return new Error(`attribute '${formatPath(info.path)}' must be a string`);

            case AttrType.Boolean:
                if (typeof attr === 'boolean') return attr;
                else return new Error(`attribute '${formatPath(info.path)}' must be a boolean`);

            default:
                return new Error();
        }
    }
};

const preprocessRecord = <T extends AttrRecord>(
    attr: unknown,
    definition: RecordAttrDef<T>,
    info: PreProcessInfo
): PartialAttr<T> | Error => {
    // allow arrays and single values instead of dictionaries
    if (Array.isArray(attr) && attr.length > definition.keyOrder.length)
        return new Error(
            `attribute '${formatPath(info.path)}' has too many entries to match [${
                definition.keyOrder
            }]`
        );
    const record = valueOrArrayOrDict(attr, definition.keyOrder);

    const invalidEntries = Object.keys(record).filter((k) => !definition.entries.hasOwnProperty(k));
    if (invalidEntries.length > 0)
        return new Error(
            `attribute '${formatPath(info.path)}' has unknown entry '${invalidEntries[0]}'`
        );

    return utils.filterError(
        definition.keyOrder.reduce((result: PartialAttr<T>, k) => {
            const def: AnyAttrDef<T[keyof T]> = definition.entries[k];
            if (!record.hasOwnProperty(k)) return result;
            else {
                const newInfo: PreProcessInfo = {
                    ...info,
                    path: info.path.concat([[k, def.type]]),
                };
                return { ...result, [k]: preprocess(record[k as string], def, newInfo) };
            }
        }, {}) as PartialAttr<T>
    );
};

const valueOrArrayOrDict = (attr: unknown, keys: ReadonlyArray<string>): object => {
    if (Array.isArray(attr))
        return attr.reduce((result, v, i) => ({ ...result, [keys[i]]: v }), {});
    else if (utils.isDict(attr)) return attr as object;
    else return { [keys[0]]: attr };
};

const preprocessLookup = <T extends Attr>(
    attr: unknown,
    definition: LookupAttrDef<T>,
    info: PreProcessInfo
): PartialAttr<AttrLookup<T>> | Error => {
    if (utils.isDict(attr)) {
        return utils.filterError(
            attrUtils.map(attr as AttrLookup<T>, definition, (k, v, def) => {
                const newInfo: PreProcessInfo = {
                    ...info,
                    path: info.path.concat([[k as string, def.type]]),
                };
                return v === null ? v : (preprocess(v, def, newInfo) as T);
            })
        ) as Error | PartialAttr<AttrLookup<T>>;
    } else return new Error(`attribute '${formatPath(info.path)}' must be a dictionary`);
};

const preprocessArray = <T extends Attr>(
    attr: unknown,
    definition: ArrayAttrDef<T>,
    info: PreProcessInfo
): PartialAttr<AttrArray<T>> | Error => {
    if (Array.isArray(attr)) {
        return utils.filterError(
            attrUtils.map(attr as AttrArray<T>, definition, (k, v, def) => {
                const newInfo: PreProcessInfo = {
                    ...info,
                    path: info.path.concat([[String(k), def.type]]),
                };
                return preprocess(v, def, newInfo) as T;
            })
        ) as Error | PartialAttr<AttrArray<T>>;
    } else return new Error(`attribute '${formatPath(info.path)}' must be an array`);
};
