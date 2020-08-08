import {
    AttrType,
    PrimitiveAttrType,
    StringAttrSpec,
    NumAttrSpec,
    BoolAttrSpec,
    RecordAttrSpec,
    ArrayAttrType,
    DictAttrSpec,
    BaseAttrSpec,
} from './attr-spec';

// === Input ===
export type InputAttr<T extends BaseAttrSpec> = T extends StringAttrSpec<infer ST>
    ? ST
    : T extends NumAttrSpec
    ? number | string // allow string variables, e.g. '2x'
    : T extends BoolAttrSpec
    ? boolean
    : T extends DictAttrSpec<infer DT>
    ? { readonly [k: string]: InputAttr<DT> }
    : T extends ArrayAttrType<infer AT>
    ? { readonly [i: number]: InputAttr<AT> }
    : T extends RecordAttrSpec<infer RT>
    ? { readonly [k in keyof RT]: InputAttr<RT[k]> }
    : never;

// === Evaluated ===
export type EvalAttr<T extends BaseAttrSpec> = T extends StringAttrSpec<infer ST>
    ? ST
    : T extends NumAttrSpec
    ? number
    : T extends BoolAttrSpec
    ? boolean
    : T extends DictAttrSpec<infer DT>
    ? { readonly [k: string]: EvalAttr<DT> }
    : T extends ArrayAttrType<infer AT>
    ? { readonly [i: number]: EvalAttr<AT> }
    : T extends RecordAttrSpec<infer RT>
    ? { readonly [k in keyof RT]: EvalAttr<RT[k]> }
    : never;
