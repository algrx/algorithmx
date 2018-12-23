import { AttrPrimitive, AttrLookup, AttrNum, AttrString, AttrBool, AttrRecord, VarSymbol, Attr, AttrArray } from './types'
import { Omit } from '../utils'

export enum AttrType {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
  Array = 'array',
  Record = 'record',
  Lookup = 'lookup',
  Any = 'any'
}

export interface IAttrDef {
  readonly type: AttrType
  readonly validVars?: ReadonlyArray<VarSymbol>
}

export interface IAttrDefPrimitive<T extends AttrPrimitive> extends IAttrDef {
  readonly type: T extends AttrNum ? AttrType.Number
    : T extends AttrString ? AttrType.String
    : T extends AttrBool ? AttrType.Boolean
    : never
  readonly validValues?: ReadonlyArray<AttrPrimitive>
  readonly symbol?: VarSymbol
}

export interface IAttrDefLookup<T extends Attr> extends IAttrDef {
  readonly type: AttrType.Lookup
  readonly entry: AttrDef<T>
}

export interface IAttrDefArray<T extends Attr> extends IAttrDef {
  readonly type: AttrType.Array
  readonly entry: AttrDef<T>
}

export interface IAttrDefRecord<T extends AttrRecord> extends IAttrDef {
  readonly type: AttrType.Record
  readonly entries: {
    readonly [k in keyof T]: AttrDef<T[k]>
  }
  readonly keyOrder: ReadonlyArray<keyof T & string>
}

export type AttrDef<T extends Attr> = T extends AttrPrimitive ? IAttrDefPrimitive<T>
  : T extends AttrLookup<infer L> ? IAttrDefLookup<L>
  : T extends AttrArray<infer A> ? IAttrDefArray<A>
  : T extends AttrRecord ? IAttrDefRecord<T>
  : never

export const extendRecordDef = <E extends B, B extends AttrRecord>
  (extendDef: IAttrDefRecord<Partial<B> & Omit<E, keyof B>>,
   baseDef: IAttrDefRecord<B>): IAttrDefRecord<E & B> => {

  return {...extendDef,
    entries: {...baseDef.entries, ...extendDef.entries } as IAttrDefRecord<E & B>['entries'],
    keyOrder: [...baseDef.keyOrder, ...extendDef.keyOrder]
  }
}
