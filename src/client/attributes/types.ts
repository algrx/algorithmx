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


// INPUT ATTRIBUTES

type InputAttrRec<T> = { [k in keyof T]?: InputAttr<T[k]> }

type InputNum = AttrNum | string

// type NumTuple<K1 extends string, K2 extends string> = { [k in K1]: AttrNum } & { [k in K2]: AttrNum }
type NumTuple<K1 extends string, K2 extends string> = { [k in K1 | K2]: AttrNum }
type InputNumTuple = InputNum | [InputNum, InputNum]

// type StrNumTuple<K1 extends string, K2 extends string, S extends string> =
//  { [k in K2]: S } & { [k in K1]: AttrNum }

type StrNumTuple<K1 extends string, K2 extends string, S extends string> = { [k in K1 | K2]: S | AttrNum }
type InputStrNumTuple<S extends string> = S | [S, InputNum]

export type InputAttr<T extends Attr> =
  T extends AttrNum ? InputNum
  : T extends AttrPrimitive ? T
  : T extends AttrLookup<infer L> ? InputAttrRec<T>


  // this is a work-around to allow number records (such as size or pos) to be specified as tuples or individual values
  : T extends NumTuple<infer NK2, infer NK2> ? InputNumTuple | InputAttrRec<T>
  : T extends StrNumTuple<infer SNK1, infer SNK2, infer S> ? InputStrNumTuple<S> | InputAttrRec<T>

  : T extends AttrRecord ? InputAttrRec<T>
  : never
