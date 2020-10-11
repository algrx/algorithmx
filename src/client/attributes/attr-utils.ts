import {
    AttrType,
    PrimitiveSpec,
    DictSpec,
    ArraySpec,
    RecordSpec,
    TupleSpec,
    AttrSpec,
    RecordEntries,
    AnyRecordSpec,
    EntrySpec,
    AnyDictSpec,
    AnyArraySpec,
    AttrKey,
    CompositeSpec,
    AnyTupleSpec,
} from './spec';
import { PartialAttr, FullAttr } from './derived';
import { mapDict, Dict, dictFromArray } from '../utils';

export const isPrimitive = (spec: AttrSpec): spec is PrimitiveSpec => {
    return (
        spec.type == AttrType.Boolean ||
        spec.type === AttrType.Number ||
        spec.type === AttrType.String
    );
};

export function getAttrEntry<T extends AttrSpec>(
    v: PartialAttr<T>,
    k: AttrKey<T>
): PartialAttr<EntrySpec<T>> | undefined;
export function getAttrEntry<T extends AttrSpec>(
    v: FullAttr<T>,
    k: AttrKey<T>
): FullAttr<EntrySpec<T>> | undefined;
export function getAttrEntry<T extends AttrSpec>(
    v: FullAttr<T> | PartialAttr<T>,
    k: AttrKey<T>
): FullAttr<EntrySpec<T>> | PartialAttr<EntrySpec<T>> | undefined {
    return ((v as unknown) as Dict<string, PartialAttr<EntrySpec<T>>>)[k as string];
}

export const getEntrySpec = <T extends AttrSpec>(spec: T, k: AttrKey<T>): EntrySpec<T> => {
    return (spec.type === AttrType.Tuple
        ? (spec as AnyTupleSpec).entry
        : spec.type === AttrType.Array
        ? (spec as AnyArraySpec).entry
        : spec.type === AttrType.Dict
        ? (spec as AnyDictSpec).entry
        : spec.type === AttrType.Record
        ? (spec as AnyRecordSpec).entries[k]
        : spec) as EntrySpec<T>;
};

type MapPartialFn<T extends AttrSpec> = (
    v: PartialAttr<EntrySpec<T>>,
    k: AttrKey<T>,
    spec: EntrySpec<T>
) => PartialAttr<EntrySpec<T>> | undefined;

type MapFullFn<T extends AttrSpec> = (
    v: FullAttr<EntrySpec<T>>,
    k: AttrKey<T>,
    spec: EntrySpec<T>
) => PartialAttr<EntrySpec<T>> | undefined;

export function mapAttr<T extends AttrSpec>(
    spec: T,
    attr: FullAttr<T>,
    fn: MapFullFn<T>
): PartialAttr<T>;
export function mapAttr<T extends AttrSpec>(
    spec: T,
    attr: PartialAttr<T>,
    fn: MapPartialFn<T>
): PartialAttr<T>;
export function mapAttr<T extends AttrSpec>(
    spec: T,
    attr: FullAttr<T> | PartialAttr<T>,
    fn: MapPartialFn<T> | MapFullFn<T>
): PartialAttr<T> {
    type E = PartialAttr<EntrySpec<T>> & FullAttr<EntrySpec<T>>;

    if (spec.type === AttrType.Record || spec.type === AttrType.Dict) {
        return (mapDict(attr as Dict<string, unknown>, (v, k) => {
            return fn(
                v as E,
                (k as string) as AttrKey<T>,
                getEntrySpec(spec, (k as string) as AttrKey<T>)
            );
        }) as unknown) as PartialAttr<T>;
    }
    if (spec.type === AttrType.Array || spec.type === AttrType.Tuple) {
        return ((attr as ReadonlyArray<unknown>).map((v, i) => {
            return fn(v as E, i as AttrKey<T>, getEntrySpec(spec, i as AttrKey<T>));
        }) as unknown) as PartialAttr<T>;
    }

    return attr as PartialAttr<T>;
}

type MapBothFn<T extends AttrSpec> = (
    v1: PartialAttr<EntrySpec<T>> | undefined,
    v2: PartialAttr<EntrySpec<T>> | undefined,
    k: AttrKey<T>,
    spec: EntrySpec<T>
) => PartialAttr<EntrySpec<T>> | undefined;

export function combineAttrs<T extends AttrSpec>(
    spec: T,
    // assume that at least one is not undefined
    prevAttr: PartialAttr<T> | undefined,
    newAttr: PartialAttr<T> | undefined,
    fn: MapBothFn<T>
): PartialAttr<T> {
    if (
        prevAttr === undefined ||
        newAttr === undefined ||
        isPrimitive(spec) ||
        spec.type === AttrType.Array ||
        spec.type === AttrType.Tuple
    ) {
        return prevAttr === undefined
            ? mapAttr(spec, newAttr!, (v, k, s) => fn(undefined, v, k, s))
            : mapAttr(spec, prevAttr!, (v, k, s) => fn(v, undefined, k, s));
    } else {
        const sharedKeys = (Array.from(
            new Set(Object.keys(prevAttr).concat(Object.keys(newAttr)))
        ) as unknown) as ReadonlyArray<AttrKey<T> & string>;

        return (dictFromArray(sharedKeys, (k) =>
            fn(getAttrEntry(prevAttr, k), getAttrEntry(newAttr, k), k, getEntrySpec(spec, k))
        ) as unknown) as PartialAttr<T>;
    }
}
