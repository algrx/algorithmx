import { InputAttr } from '../attributes/types'
import { ICanvasAttr } from '../attributes/definitions/canvas'
import { InputCanvasAnimAttr } from '../attributes/definitions/types'

export type Canvas = string | Element

export enum EnumDispatchType {
  update = 'update',
  highlight = 'highlight',
  pause = 'pause',
  start = 'start',
  stop = 'stop',
  cancel = 'cancel',
  broadcast = 'broadcast'
}
export type DispatchType = keyof typeof EnumDispatchType

interface IDispatchBase {
  readonly type: DispatchType
  readonly queue: string | null
}

export interface IDispatchUpdate extends IDispatchBase {
  readonly type: 'update'
  readonly data: {
    readonly attributes: InputAttr<ICanvasAttr>
    readonly animation: InputCanvasAnimAttr
  }
}
export interface IDispatchHighlight extends IDispatchBase {
  readonly type: 'highlight'
  readonly data: {
    readonly attributes: InputAttr<ICanvasAttr>
    readonly animation: InputCanvasAnimAttr
  }
}

export interface IDispatchPause extends IDispatchBase {
  readonly type: 'pause'
  readonly data: { readonly duration: number }
}
export interface IDispatchBroadcast extends IDispatchBase {
  readonly type: 'broadcast'
  readonly data: { readonly message: string }
}
export interface IDispatchQueueUpdate extends IDispatchBase {
  readonly type: 'start' | 'stop' | 'cancel'
  readonly data: { readonly queues: ReadonlyArray<string> | null }
}

export type DispatchEvent = IDispatchUpdate | IDispatchHighlight | IDispatchPause
  | IDispatchBroadcast | IDispatchQueueUpdate

export enum EnumReceiveType {
  broadcast = 'broadcast',
  error = 'error',
  click = 'click',
  hover = 'hover'
}
export type ReceiveType = keyof typeof EnumReceiveType

export enum EnumErrorType {
  attribute = 'attribute',
  unknown = 'unknown'
}
export type ErrorType = keyof typeof EnumErrorType

interface IReceiveBase {
  readonly type: ReceiveType
}

export interface IReceiveError extends IReceiveBase {
  readonly type: 'error'
  readonly data: {
    readonly type: ErrorType
    readonly message: string
  }
}
export interface IReceiveBroadcast extends IReceiveBase {
  readonly type: 'broadcast'
  readonly data: { readonly message: string }
}
export interface IReceiveClick extends IReceiveBase {
  readonly type: 'click'
  readonly data: { readonly id: string }
}
export interface IReceiveHover extends IReceiveBase {
  readonly type: 'hover'
  readonly data: { readonly id: string, readonly entered: boolean }
}

export type ReceiveEvent = IReceiveError | IReceiveBroadcast | IReceiveClick | IReceiveHover
