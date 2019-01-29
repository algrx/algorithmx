import { IAttrDef, AttrType, IAttrDefRecord, AttrDef, IAttrDefLookup } from './definitions'
import { Attr, AttrArray, PartialAttr, AttrPrimitive, AttrLookup, AttrEntry, AttrEntryPartial } from './types'
import * as utils from '../utils'

export type AttrEndpoint = AttrPrimitive
export type MapEndpoints<T extends Attr, E> =
  T extends AttrEndpoint ? E
  : { [k in keyof T]: MapEndpoints<T[k], E> }

export const getChildDef = <T extends Attr>(def: AttrDef<T>, k: string | number | keyof T): AttrDef<AttrEntry<T>> =>
  isDefRecord(def) ? (def as IAttrDefRecord<Attr>).entries[k as string]
    : isDefLookup(def) || isDefArray(def) ? (def as IAttrDefLookup<Attr>).entry
    : def

export const isDefRecord = (def: IAttrDef): boolean => def.type === AttrType.Record
export const isDefLookup = (def: IAttrDef): boolean => def.type === AttrType.Lookup
export const isDefArray = (def: IAttrDef): boolean => def.type === AttrType.Array
export const isDefPrimitive = (def: IAttrDef): boolean =>
  !isDefRecord(def) && !isDefLookup(def) && !isDefArray(def)

type ReduceFn<T extends Attr, M> = (result: M, k: string | number, v: AttrEntry<T>,
                                    def: AttrDef<AttrEntry<T>>) => M
type ReducePartialFn<T extends Attr, M> = (result: M, k: string | number, v: PartialAttr<AttrEntry<T>>,
                                           def: AttrDef<AttrEntry<T>>) => M

export function reduce<T extends Attr, M> (attr: T, def: AttrDef<T>, fn: ReduceFn<T, M>, init: M): M
export function reduce<T extends Attr, M> (attr: PartialAttr<T>, def: AttrDef<T>, fn: ReducePartialFn<T, M>, init: M): M
export function reduce<T extends Attr, M> (attr: T, def: AttrDef<T>, fn: ReduceFn<T, M>, init: M): M {
  if (isDefRecord(def) || isDefLookup(def))
    return Object.entries(attr).reduce((result, [k, v]) =>
      fn(result, k, v, getChildDef(def, k)), init)

  else if (isDefArray(def))
    return (attr as unknown as ReadonlyArray<AttrEntry<T>>).reduce((result, v, i) =>
      fn(result, i, v, getChildDef(def, i)), init)

  else return init
}

type MapFn<T extends Attr> = (k: string | number, v: AttrEntry<T>, def: AttrDef<AttrEntry<T>>) => AttrEntry<T>
type MapPartialFn<T extends Attr> =
  (k: string | number, v: AttrEntryPartial<T>, def: AttrDef<AttrEntry<T>>) => AttrEntryPartial<T>

export function map<T extends Attr> (attr: T, definition: AttrDef<T>, fn: MapFn<T>): T
export function map<T extends Attr> (attr: PartialAttr<T>, definition: AttrDef<T>, fn: MapPartialFn<T>): PartialAttr<T>
export function map<T extends Attr> (attr: T, definition: AttrDef<T>, fn: MapFn<T>): T {
  if (isDefRecord(definition) || isDefLookup(definition))
    return utils.mapDict(attr, (k, v) =>
      fn(k as string, v as AttrEntry<T>, getChildDef(definition, k))) as unknown as T

  else if (isDefArray(definition))
    return (attr as unknown as ReadonlyArray<AttrEntry<T>>).map((v, i) =>
      fn(i, v, getChildDef(definition, i))) as unknown as T

  else return attr
}

export function merge<T extends Attr> (prevAttr: T, changes: T, def: AttrDef<T>): T
export function merge<T extends Attr> (prevAttr: PartialAttr<T>, changes: PartialAttr<T>,
                                       def: AttrDef<T>): PartialAttr<T>
export function merge<T extends Attr> (prevAttr: T, changes: T, def: AttrDef<T>): T {
  if (isAttrEmpty(changes as PartialAttr<T>, def)) return prevAttr

  if (isDefRecord(def) || isDefLookup(def)) {
    const mergedChanges = map(changes, def, (k, v, d) =>
      prevAttr[k] === undefined ? v
      : isDefLookup(def) && (v === null || prevAttr[k] === null) ? v
      : merge(prevAttr[k] as AttrEntry<T>, v, d))
    return {...prevAttr, ...mergedChanges }

  } else if (isDefArray(def)) {
    return map(changes, def, (i: number, v, d) => {
      return v === undefined ? prevAttr[i] as AttrEntry<T>
      : prevAttr[i] === undefined ? v
      : merge(prevAttr[i] as AttrEntry<T>, v, d)
    })

  } else return changes
}

export const isAttrEmpty = <T extends Attr>(attr: PartialAttr<T>, def: AttrDef<T>): boolean => {
  if (attr === undefined) return true
  else if ((isDefLookup(def) || isDefRecord(def)) && utils.isDictEmpty(attr as object)) return true
  else if (isDefArray(def) && (attr as AttrArray<Attr>).length === 0) return true
  else if (!isDefPrimitive(def))
    return reduce(attr, def, (res, k, v, d) =>
      res === false ? res
      : isDefLookup(def) && v === null ? false
      : isAttrEmpty(v, d),
      true)
  else return false
}

export const emptyAttr = <T extends Attr>(def: AttrDef<T>): PartialAttr<T> => {
  if (isDefLookup(def) || isDefRecord(def)) return {} as PartialAttr<T>
  else if (isDefArray(def)) return [] as unknown as PartialAttr<T>
  else return undefined
}

export const newLookupEntries = <T extends AttrLookup<Attr>>
  (prevAttr: T, changes: PartialAttr<T> | undefined): PartialAttr<T> => {
  return utils.filterDict(changes || {}, (k, v) =>
    prevAttr[k] === undefined && v !== null) as  PartialAttr<T>
}

type ReduceAttrFn<T extends Attr> =
  (k: string | number, v: AttrEntryPartial<T>, def: AttrDef<AttrEntry<T>>) => AttrEntryPartial<T> | undefined

export const reduceAttr = <T extends Attr>(attr: PartialAttr<T>, def: AttrDef<T>, fn: ReduceAttrFn<T>):
                                              PartialAttr<T> => {
  if (isDefLookup(def) || isDefRecord(def)) {
    return reduce(attr, def, (result, k, v, d) => {
      const child = fn(k, v, d)
      return isAttrEmpty(child, d) ? result : {...result, [k]: child }
    }, emptyAttr(def))

  } else if (isDefArray(def)) {
    const array = map(attr, def, (k, v, d) => fn(k, v, d))
    if (isAttrEmpty(array, def)) return emptyAttr(def)
    else return array as PartialAttr<T>

  } else return emptyAttr(def)
}

export const reduceChanges = <T extends Attr>(attr: PartialAttr<T>, def: AttrDef<T>,
                                              fn: ReduceAttrFn<T>): PartialAttr<T> => {
  return reduceAttr(attr, def, (k, v, d) =>
    isDefLookup(def) && v === null ? undefined
    : fn(k, v, d))
}

export const subtractPartial = <T extends Attr>(attr: PartialAttr<T>, subtract: PartialAttr<T>,
                                                def: AttrDef<T>): PartialAttr<T> => {
  return reduceAttr(attr, def, (k, v, d) =>
    subtract[k] === undefined ? v
    : isDefLookup(def) && (v === null || subtract[k] === null) ? undefined
    : subtractPartial(v, subtract[k], d))
}

export const subtractFull = <T extends Attr>(attr: T, subtract: PartialAttr<T>, def: AttrDef<T>): T => {
  if (isDefPrimitive(def)) return attr
  else {
    // only lookup entries can be subtracted to maintain a full attribute structure
    const validEntries = isDefLookup(def)
      ? utils.filterDict(attr as object, (k, v) => subtract[k] !== null) as T
      : attr

    return map(validEntries, def, (k, v, d) =>
      subtract[k] === undefined ? v
      : subtractFull(v, subtract[k], d))
  }
}

export const keepIfDifferent = <T extends Attr>(newAttr: PartialAttr<T>, prevAttr: PartialAttr<T>,
                                                def: AttrDef<T>): PartialAttr<T> => {
  if (isDefPrimitive(def)) return newAttr !== prevAttr ? newAttr : emptyAttr(def)
  return reduceChanges(newAttr, def, (k, v, d) => keepIfDifferent(v, prevAttr[k], d))
}

export const getNullEntries = <T extends Attr>(attr: PartialAttr<T>, def: AttrDef<T>): PartialAttr<T> => {
  if (isDefLookup(def)) {
    const nullEntries =  utils.filterDict(attr as object, (k, v) => v === null) as PartialAttr<T>
    const reduced = reduceChanges(attr, def, (k, v, d) => getNullEntries(v, d))
    return {...reduced, ...nullEntries }

  } else return reduceChanges(attr, def, (k, v, d) => getNullEntries(v, d))
}

export const fillLookupEntries = <T extends Attr>(attr: T, referenceAttr: T,
                                                  def: AttrDef<T>): T => {
  if (isDefPrimitive(def)) return attr

  else if (isDefLookup(def) && attr['*'] !== undefined) {
    return map(referenceAttr, def, (k, v, d) =>
      v === null ? null
      : fillLookupEntries(attr['*'] as AttrEntry<T>, v, d))

  } else {
    const validAttr = utils.filterDict(referenceAttr as object, k => attr[k] !== undefined) as T
    return map(validAttr, def, (k, v, d) =>
      fillLookupEntries(attr[k] as AttrEntry<T>, v, d))
  }
}
