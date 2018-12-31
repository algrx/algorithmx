import { Selection } from './types/selection'
import { IAnimation, AnimationType } from '../client/attributes/definitions/animation'
import { ICommonAttr } from '../client/attributes/definitions/common'
import { ClassBuilder } from './utils'
import { Omit } from '../client/utils'
import { Attr, InputAttr } from '../client/attributes/types'
import { DispatchEvent, ReceiveEvent } from '../client/types/events'
import * as events from '../client/types/events'
import * as utils from './utils'

export interface EventHandler {
  dispatch (event: DispatchEvent): void
  subscribe (listener: (event: ReceiveEvent) => void): void
}

export interface SelListeners {
   /* tslint:disable */
  [k: string]: () => void
  /* tslint:enable */
}
export const addListener = (listeners: SelListeners, id: string, fn: () => void): void => {
  /* tslint:disable */
  listeners[id] = fn
  /* tslint:enable */
}
export const triggerListener = (listeners: SelListeners, id: string): void => {
  if (listeners[id] !== undefined) listeners[id]()
}

export interface ISelContext<T extends Attr> {
  readonly client: EventHandler
  readonly name: string
  readonly ids: ReadonlyArray<string | number>
  readonly data?: ReadonlyArray<unknown>
  readonly parent?: ISelContext<Attr>
  readonly listeners: SelListeners
  readonly initAttr?: ReadonlyArray<InputAttr<T>>
  readonly queue: string | null
  readonly animation: Partial<IAnimation>
  readonly highlight: boolean
}

export const defaultContext: Omit<ISelContext<Attr>, 'client' | 'initAttr'> = {
  name: '',
  ids: [],
  listeners: {},
  queue: 'default',
  animation: {},
  highlight: false
}

export const builder: ClassBuilder<Selection, ISelContext<ICommonAttr>> = (context, self, construct) => ({
  visible: visible => {
    context.client.dispatch(utils.attrEvent(context, visible, d => ({ visible: d })))
    return self()
  },

  add: () => {
    context.client.dispatch(utils.attrEvent(({...context, data: context.ids }), (id, i) => i, i => ({
      visible: true,
      ...(context.initAttr ? context.initAttr[i] : {})
    })))
    return self().duration(0)
  },
  remove: () => {
    context.client.dispatch(utils.attrEvent(context, false, d => null))
    return self()
  },

  eventQ: (name = 'default') => construct({...context,
    queue: name === null ? null : String(name)
  }),
  animate: type => construct({...context,
    animation: {...context.animation, type: type }
  }),
  duration: milliseconds => construct({...context,
    animation: {...context.animation, duration: milliseconds }
  }),
  ease: ease => construct({...context,
    animation: {...context.animation, ease: ease }
  }),
  highlight: milliseconds => construct({...context,
    highlight: true,
    animation: milliseconds !== undefined ? {...context.animation, linger: milliseconds } : context.animation
  }),

  data: data => construct({...context,
    data: context.ids.map((id, i) =>
      typeof data === 'function' && context.data !== undefined ? data(context.data[i], i)
      : Array.isArray(data) ? data[i]
      : data)
  }),

  pause: milliseconds => {
    context.client.dispatch({
      type: events.DispatchEventType.Pause,
      queue: context.queue,
      data: { duration: milliseconds }
    })
    return self()
  },

  start: () => {
    context.client.dispatch({ type: events.DispatchEventType.Start, queue: context.queue })
    return self()
  },
  stop: () => {
    context.client.dispatch({ type: events.DispatchEventType.Stop, queue: context.queue })
    return self()
  },
  cancel: () => {
    context.client.dispatch({ type: events.DispatchEventType.Cancel, queue: context.queue })
    return self()
  },

  broadcast: message => {
    context.client.dispatch({
      type: events.DispatchEventType.Broadcast,
      queue: context.queue,
      data: { message: `broadcast-${message}` }
    })
    return self()
  },
  listen: (message, onReceive) => {
    addListener(context.listeners, `broadcast-${message}`, onReceive)
    return self()
  },

  callback: onCallback => {
    const message = `callback-${Math.random().toString(36).substr(2, 9)}`
    addListener(context.listeners, message, onCallback)
    context.client.dispatch({
      type: events.DispatchEventType.Broadcast,
      queue: context.queue,
      data: { message: message }
    })
    return self()
  }
})
