import { InputElementAttr } from '../client/attributes/definitions/types'
import { Selection } from './types/selection'
import { IAnimation } from '../client/attributes/definitions/animation'
import { ICommonAttr } from '../client/attributes/definitions/common'
import { ClassBuilder } from './utils'
import { Omit } from '../client/utils'
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

export interface ISelContext<T extends InputElementAttr> {
  readonly client: EventHandler
  readonly name: string
  readonly ids: ReadonlyArray<string | number>
  readonly data?: ReadonlyArray<unknown>
  readonly parent?: ISelContext<InputElementAttr>
  readonly listeners: SelListeners
  readonly initattr?: ReadonlyArray<T>
  readonly queue: string | null
  readonly animation: Partial<IAnimation>
  readonly highlight: boolean
}

export const defaultContext: Omit<ISelContext<ICommonAttr>, 'client' | 'initattr'> = {
  name: '',
  ids: [],
  listeners: {},
  queue: 'default',
  animation: {},
  highlight: false
}

export const builder: ClassBuilder<Selection<InputElementAttr>, ISelContext<InputElementAttr>> =
  (context, self, construct) => ({

  visible: visible => {
    context.client.dispatch(utils.attrEvent(context, visible, d => ({ visible: d })))
    return self()
  },

  add: () => {
    context.client.dispatch(utils.attrEvent(({...context, data: context.ids }), (id, i) => i, i => ({
      visible: true,
      ...(context.initattr ? context.initattr[i] : {})
    })))
    return self().duration(0)
  },
  remove: () => {
    context.client.dispatch(utils.attrEvent(context, false, d => null))
    return self()
  },

  set: attrs => {
    context.client.dispatch(utils.attrEvent(context, attrs, d => d))
    return self()
  },

  eventQ: (queue = 'default') => construct({...context,
    queue: queue === null ? null : String(queue)
  }),

  animate: (type = 'normal') => construct({...context,
    animation: {...context.animation, type: type }
  }),
  duration: seconds => construct({...context,
    animation: {...context.animation, duration: seconds }
  }),
  ease: ease => construct({...context,
    animation: {...context.animation, ease: ease }
  }),
  highlight: seconds => construct({...context,
    highlight: true,
    animation: seconds !== undefined ? {...context.animation, linger: seconds } : context.animation
  }),

  data: data => construct({...context,
    data: context.ids.map((id, i) =>
      typeof data === 'function' && context.data !== undefined ? data(context.data[i], i)
      : Array.isArray(data) ? data[i]
      : data)
  }),

  pause: seconds => {
    context.client.dispatch({
      type: events.EnumDispatchType.pause,
      queue: context.queue,
      data: { duration: seconds }
    })
    return self()
  },

  stop: (queue = 'default') => {
    context.client.dispatch(utils.queueEvent(context, 'stop', queue))
    return self()
  },
  stopall: () => {
    context.client.dispatch(utils.queueEvent(context, 'stop', null))
    return self()
  },

  start: (queue = 'default') => {
    context.client.dispatch(utils.queueEvent(context, 'start', queue))
    return self()
  },
  startall: () => {
    context.client.dispatch(utils.queueEvent(context, 'start', null))
    return self()
  },

  cancel: (queue = 'default') => {
    context.client.dispatch(utils.queueEvent(context, 'cancel', queue))
    return self()
  },
  cancelall: () => {
    context.client.dispatch(utils.queueEvent(context, 'cancel', null))
    return self()
  },

  broadcast: message => {
    context.client.dispatch({
      type: events.EnumDispatchType.broadcast,
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
      type: events.EnumDispatchType.broadcast,
      queue: context.queue,
      data: { message: message }
    })
    return self()
  }
})
