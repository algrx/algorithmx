import { InputAttr, PartialAttr } from '../attributes/types'
import { ICanvasAttr } from '../attributes/definitions/canvas'
import { IAnimation } from '../attributes/definitions/animation'

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
    readonly animation: PartialAttr<IAnimation>
  }
}
export interface IDispatchHighlight extends IDispatchBase {
  readonly type: 'highlight'
  readonly data: {
    readonly attributes: InputAttr<ICanvasAttr>
    readonly animation: PartialAttr<IAnimation>
  }
}

export interface IDispatchEventPause extends IDispatchBase {
  readonly type: 'pause'
  readonly data: { readonly duration: number }
}
export interface IDispatchEventBroadcast extends IDispatchBase {
  readonly type: 'broadcast'
  readonly data: { readonly message: string }
}
export interface IDispatchEventQueueUpdate extends IDispatchBase {
  readonly type: 'start' | 'stop' | 'cancel'
  readonly data: { readonly queue: string | null }
}

export type DispatchEvent = IDispatchUpdate | IDispatchHighlight | IDispatchEventPause
  | IDispatchEventBroadcast | IDispatchEventQueueUpdate

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

interface IReceiveEventBase {
  readonly type: ReceiveType
}

export interface IReceiveEventError extends IReceiveEventBase {
  readonly type: 'error'
  readonly data: {
    readonly type: ErrorType
    readonly message: string
  }
}
export interface IReceiveEventBroadcast extends IReceiveEventBase {
  readonly type: 'broadcast'
  readonly data: { readonly message: string }
}
export interface IReceiveEventClick extends IReceiveEventBase {
  readonly type: 'click'
  readonly data: { readonly id: string }
}
export interface IReceiveEventHover extends IReceiveEventBase {
  readonly type: 'hover'
  readonly data: { readonly id: string, readonly entered: boolean }
}

export type ReceiveEvent = IReceiveEventError | IReceiveEventBroadcast
  | IReceiveEventClick | IReceiveEventHover
