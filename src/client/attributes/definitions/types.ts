import { Attr, InputAttr, AttrRecord, AttrLookup, AttrPrimitive } from '../types'
import { IElementAttr, ISvgMixinAttr } from './element'
import { ICanvasAttr } from './canvas'
import { INodeAttr } from './node'
import { IEdgeAttr } from './edge'
import { ILabelAttr } from './label'
import { IAnimation } from './animation'

export type InputElementAttr = InputAttr<IElementAttr>
export type InputSvgMixinAttr = InputAttr<ISvgMixinAttr>

export type InputCanvasAttr = InputAttr<ICanvasAttr>
export type InputNodeAttr = InputAttr<INodeAttr>
export type InputEdgeAttr = InputAttr<IEdgeAttr>
export type InputLabelAttr = InputAttr<ILabelAttr>


type ExtraInfoAttr<T extends Attr, A extends Attr> =
  T extends AttrPrimitive ? A
  : T extends AttrLookup<infer L> ? { [k in keyof T]?: ExtraInfoAttr<T[k], A> }
  : T extends AttrRecord ? { [k in keyof T]?: ExtraInfoAttr<T[k], A> } & { readonly '**'?: A }
  : never

export type InputAnimAttr<T extends Attr> = ExtraInfoAttr<T, Partial<IAnimation>>
export type InputCanvasAnimAttr = InputAnimAttr<ICanvasAttr>
