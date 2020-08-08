// === Generic Attr Types ===

export enum AttrType {
    Number = 'number',
    String = 'string',
    Boolean = 'boolean',
    Array = 'array',
    Record = 'record',
    Dict = 'lookup',
}

export type PrimitiveAttrType = AttrType.String | AttrType.Number | AttrType.Boolean;

export interface BaseAttrSpec {
    readonly type: AttrType;
    readonly validVars?: ReadonlyArray<string>; // e.g. 'x' when used in '2x'
}

export interface StringAttrSpec<T extends string> extends BaseAttrSpec {
    readonly type: AttrType.String;
    readonly validValues?: ReadonlyArray<T>;
}
export type AnyStringAttrSpec = StringAttrSpec<string>;

export interface NumAttrSpec extends BaseAttrSpec {
    readonly type: AttrType.Number;
}
export interface BoolAttrSpec extends BaseAttrSpec {
    readonly type: AttrType.Boolean;
}

export type AnyPrimitiveAttrType = AnyStringAttrSpec | NumAttrSpec | BoolAttrSpec;

export interface DictAttrSpec<T extends BaseAttrSpec> extends BaseAttrSpec {
    readonly type: AttrType.Dict;
    readonly entry: T;
}
export type AnyDictAttrSpec = DictAttrSpec<BaseAttrSpec>;

export interface ArrayAttrType<T extends BaseAttrSpec> extends BaseAttrSpec {
    readonly type: AttrType.Array;
    readonly entry: T;
}
//export type AnyArrayAttrSpec = ArrayAttrType<BaseAttrSpec>

type RecordAttrType = { readonly [k: string]: BaseAttrSpec };
export interface RecordAttrSpec<T extends RecordAttrType> extends BaseAttrSpec {
    readonly type: AttrType.Record;
    readonly entries: {
        readonly [k in keyof T]: T[k];
    };
    readonly keyOrder?: ReadonlyArray<keyof T>;
}
export type AnyRecordAttrSpec = RecordAttrSpec<{ readonly [k: string]: BaseAttrSpec }>;

// export type AnyAttrSpec = AnyPrimitiveAttrType | AnyDictAttrSpec | AnyArrayAttrSpec | AnyRecordAttrType

// === Spec Builders ===

export const combineRecordAttrSpec = <E extends RecordAttrType, B extends RecordAttrType>(
    extendType: RecordAttrSpec<E>,
    baseType: RecordAttrSpec<B>
): RecordAttrSpec<E & B> => {
    return {
        type: AttrType.Record,
        entries: { ...baseType.entries, ...extendType.entries },
    };
};

export const createDictAttrSpec = <T extends BaseAttrSpec>(entrySpec: T): DictAttrSpec<T> => ({
    type: AttrType.Dict,
    entry: entrySpec,
});

export const createRecordAttrSpec = <T extends { readonly [k: string]: BaseAttrSpec }>(
    recordSpec: T,
    baseSpec?: BaseAttrSpec,
    keyOrder?: ReadonlyArray<keyof T>
): RecordAttrSpec<T> => ({
    ...baseSpec,
    type: AttrType.Record,
    entries: recordSpec,
    keyOrder: keyOrder,
});
