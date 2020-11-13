export type Dict<K extends string, V> = { readonly [k in K]: V };
export type PartialDict<K extends string, V> = Partial<Dict<K, V>>;

export const dictValues = <V>(dict: Dict<string, V>): ReadonlyArray<V> => {
    return Object.values(dict);
};
export const dictKeys = <K extends string>(dict: Dict<K, unknown>): ReadonlyArray<K> => {
    return (Object.keys(dict) as unknown) as ReadonlyArray<K>;
};

export const mapDict = <K extends string, V1, V2>(
    dict: Dict<K, V1>,
    fn: (v: V1, k: K, i: number) => V2 | undefined
): Dict<K, V2> => {
    let newDict = {} as Partial<Dict<K, V2>>;
    const keys = Object.keys(dict);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i] as K;
        const v = fn(dict[k], k, i);
        if (v !== undefined) newDict[k] = v;
    }
    return newDict as Dict<K, V2>;
};

export const mapDictKeys = <K extends string, V>(
    dict: Dict<K, V>,
    fn: (v: V, k: K, i: number) => K | undefined
): Dict<K, V> => {
    let newDict = {} as Partial<Dict<K, V>>;
    const keys = Object.keys(dict);
    for (let i = 0; i < keys.length; i++) {
        const prevK = keys[i] as K;
        const k = fn(dict[prevK], prevK, i);
        if (k !== undefined) newDict[k] = dict[k];
    }
    return newDict as Dict<K, V>;
};

export const filterDict = <T extends Dict<string, unknown>>(
    dict: T,
    fn: <K extends keyof T>(v: T[K], k: K & string, i: number) => boolean
): Partial<T> => {
    let newDict = {} as Partial<T>;
    const keys = Object.keys(dict);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i] as keyof T & string;
        if (fn(dict[k], k, i)) newDict[k] = dict[k];
    }
    return newDict;
};

export const dictFromArray = <K extends string, V>(
    keys: ReadonlyArray<K>,
    fn: (k: K) => V | undefined
): Dict<K, V> => {
    let dict = {} as Partial<Dict<K, V>>;
    keys.forEach((k) => {
        const v = fn(k);
        if (v !== undefined) dict[k] = v;
    });
    return dict as Dict<K, V>;
};

export const assignKeys = <T extends {}>(
    prevObj: T,
    newObj: T,
    keys: ReadonlyArray<keyof T>
): T => {
    let mergedObj = { ...prevObj };
    keys.forEach((k) => {
        if (!(k in mergedObj) && k in newObj) mergedObj[k] = newObj[k];
    });
    return mergedObj;
};

export const isObj = (value: unknown): value is {} => {
    return typeof value === 'object' && !Array.isArray(value);
};

export const isObjEmpty = (value: {}) => {
    return Object.keys(value).length === 0;
};

export const isNum = (value: unknown): value is number => {
    return !isNaN(value as number);
};

export const isNumericalStr = (value: string): boolean => {
    return !isNaN((value as unknown) as number) && value !== '';
};

export const dashToUpperCamel = (str: string) =>
    str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.substr(1))
        .join('');

type RPartial<T> = T extends {} ? { readonly [k in keyof T]?: RPartial<T[k]> } : T;

export const mergeDiff = <T>(obj: T, diff: RPartial<T>): T => {
    if (isObj(obj)) {
        let newObj = {} as T;
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i] as keyof T;
            newObj[k] =
                k in diff
                    ? mergeDiff(obj[k], (diff[k] as unknown) as RPartial<T[keyof T]>)
                    : obj[k];
        }
        return newObj;
    }
    return diff as T;
};

/*
export interface Lookup<T> {
    readonly [k: string]: T;
}
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type MapDict<D, M> = { [k in keyof D]: M };
export type Primitive = string | number | boolean;

export type RPartial<T> = T extends object
    ? {
          readonly [k in keyof T]?: RPartial<T[k]>;
      }
    : T;

export const mapDict = <T, M>(
    dict: T,
    func: (k: keyof T, v: T[keyof T], i: number) => V[keyof V]
): V => {
    let newDict = {};
    const keys = Object.keys(dict);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        newDict[k] = func(k as keyof T, dict[k], i);
    }
    return newDict as MapDict<T, M>;
};

export const enumValues = <T>(enumeration: T): ReadonlyArray<T[keyof T]> =>
    Object.keys(enumeration).map((k) => enumeration[k]);

export const isDict = (value: unknown): value is object =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const isDictEmpty = (dict: object) => Object.keys(dict).length === 0;

export const filterError = <T>(value: { [k in keyof T]: T[k] | Error }): T | Error => {
    const error = Array.isArray(value)
        ? value.find((v) => v instanceof Error)
        : typeof value === 'object'
        ? Object.values(value).find((v) => v instanceof Error)
        : value;
    return error || value;
};

type FilterFn<T> = (k: keyof T, v: T[keyof T], i: number) => boolean;
export const filterDict = <T extends object>(dict: T, filterFn: FilterFn<T>): Partial<T> => {
    return Object.entries(dict).reduce(
        (newDict, [k, v], i) => ({
            ...newDict,
            ...(filterFn(k as keyof T, v, i) ? { [k]: v } : {}),
        }),
        {}
    );
};

export const removeWhitespace = (s: string) => s.replace(/\s/g, '');

export const randomId = (): string => Math.random().toString(36).substr(2, 9);
*/

/*
export const reduceDict = <T extends Dict<string, unknown>, V>(
    dict: T,
    fn: <K extends keyof T>(acc: V, v: T[K], k: K & string, i: number) => V,
    init: V
): V => {
    const keys = Object.keys(dict);
    let acc = init;
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i] as keyof T & string;
        acc = fn(acc, dict[k], k, i);
    }
    return acc;
};
*/

/*
export const mapObj = <T extends {}, V extends Dict<keyof T & string, unknown> = T>(
    dict: T,
    fn: <K extends keyof T>(v: T[K], k: K & string, i: number) => V[keyof V] | undefined
): V => {
    let newDict = {} as Partial<V>;
    const keys = Object.keys(dict);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i] as keyof T & string;
        const v = fn(dict[k], k, i);
        if (v !== undefined) newDict[k as keyof V] = v;
    }
    return newDict as V;
};

export const mapDict: <T extends Dict<string, unknown>, VE>(
    dict: T,
    fn: <K extends keyof T>(v: T[K], k: K & string, i: number) => VE
) => { readonly [k in keyof T]: VE } = mapObj;
*/
