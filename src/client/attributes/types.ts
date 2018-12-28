import { Lookup } from '../utils'

export enum EnumVarSymbol {
  Width = 'x',
  Height = 'y',
  Radius = 'r',
  Angle = 'a',
  CanvasWidth = 'cx',
  CanvasHeight = 'cy'
}
export type VarSymbol = 'x' | 'y' | 'r' | 'a' | 'cx' | 'cy'

export interface INumExpr {
  readonly m: number,
  readonly x: VarSymbol,
  readonly c: number
}

export type AttrNum = number | INumExpr
export type AttrString = string
export type AttrBool = boolean
export type AttrPrimitive = AttrNum | AttrString | AttrBool

export interface AttrRecord {}
export type AttrLookup<T extends AttrPrimitive | AttrRecord> = Lookup<T> & { readonly '*': T }
export type AttrArray<T extends AttrPrimitive | AttrRecord> = ReadonlyArray<T>

export interface AttrObject { readonly [k: string]: Attr }

export type AttrLookupAny = AttrLookup<AttrPrimitive | AttrRecord>
export type AttrArrayAny = AttrArray<AttrPrimitive | AttrRecord>

export type Attr = AttrPrimitive | AttrRecord
  | AttrLookup<AttrPrimitive | AttrRecord>
  | AttrArray<AttrPrimitive | AttrRecord>

export type AttrEntry2<T extends Attr> =
  T extends AttrEvalPartial<infer E> ? AttrEvalPartial<AttrEntry<E>>
  : never

export type AttrEntry<T extends Attr> =
  T extends AttrPrimitive ? T
  : T extends AttrLookup<infer E2> ? E2
  : T extends AttrArray<infer E1> ? E1
  : T extends AttrRecord ? T[keyof T]
  : never

export type AttrEntryPartial<T extends Attr> = PartialAttr<AttrEntry<T>>

export type AttrPrimEvaluated<T extends AttrPrimitive> =
  T extends AttrNum ? number
  : T extends AttrString ? T & string
  : T extends AttrBool ? boolean
  : never

export type AttrEvalPartial<T extends Attr> = PartialAttr<AttrEval<T>>

export type AttrEval<T extends Attr> =
  T extends AttrPrimitive ? AttrPrimEvaluated<T>
  : T extends AttrArray<infer A> ? T // should be: AttrArray<AttrEval<A>>
  : { [k in keyof T]: AttrEval<T[k]> }

export type PartialAttr<T extends Attr> =
  T extends AttrPrimitive ? T
  : T extends AttrArray<infer A> ? T // should be: AttrArray<PartialAttr<A>>
  : { [k in keyof T]?: PartialAttr<T[k]> }

type InputAttrRec<T> = { [k in keyof T]?: InputAttr<T[k]> }
export type InputAttr<T extends Attr> =
  T extends AttrNum ? T | string
  : T extends AttrPrimitive ? T
  : T extends AttrLookup<infer L> ? InputAttrRec<T>

  // this is a work-around to allow number records (such as size or pos) to be specified as arrays
  : T extends { readonly [s: string]: AttrNum } ? InputAttrRec<T> | ReadonlyArray<AttrNum | string>

  // should end with: ReadonlyArray<InputAttr<AttrEntry<T>>>
  : T extends AttrRecord ? InputAttrRec<T> | ReadonlyArray<AttrEntry<T>>
  : never
