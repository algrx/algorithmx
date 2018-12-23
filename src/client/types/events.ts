import { InputAttr, PartialAttr } from '../attributes/types'
import { ICanvasAttr } from '../attributes/definitions/canvas'
import { IAnimation } from '../attributes/definitions/animation'

export type Canvas = string | SVGSVGElement

export enum DispatchEventType {
  Update = 'update',
  Highlight = 'highlight',
  Pause = 'pause',
  Start = 'start',
  Stop = 'stop',
  Cancel = 'cancel',
  Broadcast = 'broadcast'
}

interface IDispatchEventBase {
  readonly type: DispatchEventType
  readonly queue: string | null
}

export interface IDispatchEventUpdate extends IDispatchEventBase {
  readonly type: DispatchEventType.Update
  readonly data: {
    readonly attributes: InputAttr<ICanvasAttr>
    readonly animation: PartialAttr<IAnimation>
  }
}
export interface IDispatchEventHighlight extends IDispatchEventBase {
  readonly type: DispatchEventType.Highlight
  readonly data: {
    readonly attributes: InputAttr<ICanvasAttr>
    readonly animation: PartialAttr<IAnimation>
  }
}

export interface IDispatchEventPause extends IDispatchEventBase {
  readonly type: DispatchEventType.Pause
  readonly data: { readonly duration: number }
}
export interface IDispatchEventBroadcast extends IDispatchEventBase {
  readonly type: DispatchEventType.Broadcast
  readonly data: { readonly message: string }
}
export interface IDispatchEventQueueUpdate extends IDispatchEventBase {
  readonly type: DispatchEventType.Start | DispatchEventType.Stop | DispatchEventType.Cancel
}

export type DispatchEvent = IDispatchEventUpdate | IDispatchEventHighlight | IDispatchEventPause
  | IDispatchEventBroadcast | IDispatchEventQueueUpdate

export enum ReceiveEventType {
  Broadcast = 'broadcast',
  Error = 'error',
  Click = 'click',
  Hover = 'hover'
}

export enum ErrorType {
  Attribute = 'attribute',
  Unknown = 'unknown'
}

interface IReceiveEventBase {
  readonly type: ReceiveEventType
}

export interface IReceiveEventError extends IReceiveEventBase {
  readonly type: ReceiveEventType.Error
  readonly data: {
    readonly type: ErrorType
    readonly message: string
  }
}
export interface IReceiveEventBroadcast extends IReceiveEventBase {
  readonly type: ReceiveEventType.Broadcast
  readonly data: { readonly message: string }
}
export interface IReceiveEventClick extends IReceiveEventBase {
  readonly type: ReceiveEventType.Click
  readonly data: { readonly id: string }
}
export interface IReceiveEventHover extends IReceiveEventBase {
  readonly type: ReceiveEventType.Hover
  readonly data: { readonly id: string, readonly entered: boolean }
}

export type ReceiveEvent = IReceiveEventError | IReceiveEventBroadcast
  | IReceiveEventClick | IReceiveEventHover
