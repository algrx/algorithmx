// === Generic attribute specs ===

export enum AttrType {
    Number = 'number',
    String = 'string',
    Boolean = 'boolean',
    Tuple = 'tuple',
    Array = 'array',
    Record = 'record',
    Dict = 'lookup',
}

export type PrimitiveAttrType = AttrType.String | AttrType.Number | AttrType.Boolean;

export interface StringSpec {
    readonly type: AttrType.String;
}
export interface ExactStringSpec<T extends string> extends StringSpec {
    readonly validValues: ReadonlyArray<T>;
}

export interface NumSpec {
    readonly type: AttrType.Number;
}

export interface BoolSpec {
    readonly type: AttrType.Boolean;
}

export type PrimitiveSpec = StringSpec | NumSpec | BoolSpec;

export interface TupleSpec<T extends PrimitiveSpec> {
    readonly type: AttrType.Tuple;
    readonly entry: T;
}
export type AnyTupleSpec = TupleSpec<PrimitiveSpec>;

export interface DictSpec<T extends AttrSpec> {
    readonly type: AttrType.Dict;
    readonly entry: T;
}
export type AnyDictSpec = DictSpec<AttrSpec>;

export interface ArraySpec<T extends AttrSpec> {
    readonly type: AttrType.Array;
    readonly entry: T;
}
export type AnyArraySpec = ArraySpec<PrimitiveSpec>;

export type RecordSpecType = { readonly [k: string]: AttrSpec };
export interface RecordSpec<T extends RecordSpecType> {
    readonly type: AttrType.Record;
    readonly entries: {
        readonly [k in keyof T]: T[k];
    };
    readonly validVars?: ReadonlyArray<string>;
}
export type AnyRecordSpec = RecordSpec<RecordSpecType>;

export type RecordEntries<T extends RecordSpec<RecordSpecType>> = T['entries'];

// === Attribute spec type utils ===

export type EntrySpec<T extends AttrSpec> = T extends PrimitiveSpec
    ? T
    : T extends TupleSpec<infer TE>
    ? TE
    : T extends DictSpec<infer DE>
    ? DE
    : T extends ArraySpec<infer AE>
    ? AE
    : T extends RecordSpec<infer RES>
    ? RES[keyof RES]
    : never;

export type AttrKey<T extends AttrSpec> = T extends TupleSpec<infer TE>
    ? number
    : T extends DictSpec<infer DE>
    ? string
    : T extends ArraySpec<infer AE>
    ? number
    : T extends RecordSpec<infer RES>
    ? keyof RES
    : string;

// === Attribute spec catagories ===

export type CompositeSpec =
    | TupleSpec<PrimitiveSpec>
    | RecordSpec<RecordSpecType>
    | ArraySpec<AttrSpec>
    | DictSpec<AttrSpec>;

export type EndpointValueSpec =
    | PrimitiveSpec
    | TupleSpec<PrimitiveSpec>
    | ArraySpec<PrimitiveSpec>
    | ArraySpec<TupleSpec<PrimitiveSpec>>;

export type AttrSpec = PrimitiveSpec | CompositeSpec;
