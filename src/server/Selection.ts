import { InputElementAttr, InputSvgMixinAttr, InputCanvasAnimAttr } from '../client/attributes/definitions/types'
import { IAnimation } from '../client/attributes/definitions/animation'
import { IElementAttr } from '../client/attributes/definitions/element'
import { Selection } from './types/selection'
import { ClassBuilder } from './utils'
import { Omit } from '../client/utils'
import { DispatchEvent, ReceiveEvent } from '../client/types/events'
import { ElementArg } from './types/types'
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
  readonly data: ReadonlyArray<unknown> | null
  readonly parent?: ISelContext<InputElementAttr>
  readonly listeners: SelListeners
  readonly initattr?: ReadonlyArray<T>
  readonly queue: string | null
  readonly animation: InputCanvasAnimAttr
  readonly highlight: boolean
}

export const defaultContext = (): Omit<ISelContext<IElementAttr>, 'client' | 'initattr' | 'data'> => ({
  name: '',
  ids: [],
  listeners: {},
  queue: 'default',
  animation: {},
  highlight: false
})

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

  duration: seconds => construct({...context,
    animation: utils.updateAnimation(context, seconds, d => ({ duration: d }))
  }),
  ease: ease => construct({...context,
    animation: utils.updateAnimation(context, ease, d => ({ ease: d }))
  }),
  highlight: seconds => construct({...context,
    highlight: true,
    animation: seconds !== undefined ? utils.updateAnimation(context, seconds, d => ({ linger: d })) : context.animation
  }),

  data: data => construct({...context,
    data: data === null ? null : context.ids.map((id, i) =>
      typeof data === 'function' ? data(context.data === null ? null : context.data[i], i)
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

export const svgMixinAttrBuilder = <T extends InputSvgMixinAttr & InputElementAttr, S extends Selection<T>>
  (context: ISelContext<T>, self: () => S) => ({

  svgattr: (key: string, value: ElementArg<string | number | null>) => {
    context.client.dispatch(utils.attrEvent(context, value, d => ({ svgattr: { [key]: d } } as T)))
    return self()
  }
})
