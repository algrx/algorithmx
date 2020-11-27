import { NumExpr } from './expression';
import {
    AttrType,
    AttrSpec,
    StringSpec,
    NumSpec,
    BoolSpec,
    PrimitiveSpec,
    RecordSpec,
    ArraySpec,
    DictSpec,
    TupleSpec,
    RecordEntries,
    ExactStringSpec,
    EndpointValueSpec,
} from './spec';

// === (Partial) Input ===

type InputPrimitiveAttr<T extends PrimitiveSpec> = T extends BoolSpec
    ? boolean
    : T extends NumSpec
    ? number | string | NumExpr<string> // allow string variables, e.g. '2x'
    : T extends ExactStringSpec<infer ST>
    ? ST
    : T extends StringSpec
    ? string | number
    : never;

export type InputEndpointAttr<T extends EndpointValueSpec> = T extends PrimitiveSpec
    ? InputPrimitiveAttr<T>
    : T extends TupleSpec<infer TE>
    ? // allow single value tuple shortcuts, e.g. 2 -> [2, 2]
      InputPrimitiveAttr<TE> | [InputPrimitiveAttr<TE>, InputPrimitiveAttr<TE>]
    : T extends ArraySpec<infer AE>
    ? AE extends EndpointValueSpec
        ? ReadonlyArray<InputEndpointAttr<AE>>
        : never
    : never;

export type InputAttr<T extends AttrSpec> = T extends EndpointValueSpec
    ? InputEndpointAttr<T>
    : T extends ArraySpec<infer AE>
    ? ReadonlyArray<InputAttr<AE>>
    : T extends DictSpec<infer DE>
    ? { readonly [k: string]: InputAttr<DE> }
    : T extends RecordSpec<infer RES>
    ? RES extends { readonly value: EndpointValueSpec }
        ? InputEndpointAttr<RES['value']> | { readonly [k in keyof RES]?: InputAttr<RES[k]> }
        : { readonly [k in keyof RES]?: InputAttr<RES[k]> }
    : never;

// === Full ===
export type FullAttr<T extends AttrSpec, Eval = false> = T extends BoolSpec
    ? boolean
    : T extends NumSpec
    ? Eval extends true
        ? number
        : number | NumExpr<string>
    : T extends ExactStringSpec<infer ST>
    ? ST
    : T extends StringSpec
    ? string
    : T extends TupleSpec<infer TE>
    ? [FullAttr<TE, Eval>, FullAttr<TE, Eval>]
    : T extends ArraySpec<infer AE>
    ? ReadonlyArray<FullAttr<AE, Eval>>
    : T extends RecordSpec<infer RES>
    ? { readonly [k in keyof RES]: FullAttr<RES[k], Eval> }
    : T extends DictSpec<infer DE>
    ? { readonly [k: string]: FullAttr<DE, Eval> }
    : never;

export type FullEvalAttr<T extends AttrSpec> = FullAttr<T, true>;

// === Partial ===
export type PartialAttr<T extends AttrSpec, Eval = false> = T extends RecordSpec<infer RES>
    ? { readonly [k in keyof RES]?: PartialAttr<RES[k], Eval> }
    : T extends DictSpec<infer DE>
    ? { readonly [k: string]: PartialAttr<DE, Eval> }
    : T extends ArraySpec<infer AE>
    ? ReadonlyArray<PartialAttr<AE, Eval>>
    : FullAttr<T, Eval>;

export type PartialEvalAttr<T extends AttrSpec> = PartialAttr<T, true>;
