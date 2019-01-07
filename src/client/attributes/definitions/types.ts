import { InputAttr } from '../types'
import { ICommonAttr } from './common'
import { ICanvasAttr } from './canvas'
import { INodeAttr } from './node'
import { IEdgeAttr } from './edge'
import { ILabelAttr } from './label'

export type InputElementAttr = InputAttr<ICommonAttr>

export type InputCanvasAttr = InputAttr<ICanvasAttr>
export type InputNodeAttr = InputAttr<INodeAttr>
export type InputEdgeAttr = InputAttr<IEdgeAttr>
export type InputLabelAttr = InputAttr<ILabelAttr>
