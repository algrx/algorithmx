import { InputAttr } from '../types'
import { IElementAttr, ISvgMixinAttr } from './element'
import { ICanvasAttr } from './canvas'
import { INodeAttr } from './node'
import { IEdgeAttr } from './edge'
import { ILabelAttr } from './label'

export type InputElementAttr = InputAttr<IElementAttr>
export type InputSvgMixinAttr = InputAttr<ISvgMixinAttr>

export type InputCanvasAttr = InputAttr<ICanvasAttr>
export type InputNodeAttr = InputAttr<INodeAttr>
export type InputEdgeAttr = InputAttr<IEdgeAttr>
export type InputLabelAttr = InputAttr<ILabelAttr>
