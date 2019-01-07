import { InputElementAttr, InputCanvasAttr } from '../client/attributes/definitions/types'
import { ISelContext } from './Selection'
import { Omit } from '../client/utils'
import { ElementArg, ElementFn } from './types/types'
import * as events from '../client/types/events'

export type ClassBuilder<T, C> = (context: C, self: () => T, construct: (args: C) => T) => T

export function build<T, C> (builder: ClassBuilder<T, C>, context: C): T {
  const construct = (args: C) => build(builder, args)
  const instance = builder(context, () => instance, construct)
  return instance
}

export function inherit<T extends P, P extends object> (obj: Omit<T, keyof P>, parent: P): T {
  return Object.setPrototypeOf(obj, parent)
}

type AttrFromArgFn<T extends InputElementAttr, A> = ((d: A) => T)
type AttrFromArg<T extends InputElementAttr, A> = T | AttrFromArgFn<T, A>

const getAttrEntry = <T extends InputElementAttr, A>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: AttrFromArg<T, A>, index: number): T => {

  if (typeof attr === 'function') {
    const evalArg = typeof arg === 'function'
      ? ((arg as ElementFn<A>)(sel.data[index], index))
      : arg
    return (attr as AttrFromArgFn<T, A>)(evalArg)
  } else return attr
}

const createParentAttr = <T extends InputElementAttr, P extends InputElementAttr, A>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: AttrFromArg<T, A>): AttrFromArg<P, A> => {

  if (typeof attr === 'function' && sel.data === undefined) {
    return ((a: A) => ({
      [sel.name]: sel.ids.reduce((result, id) =>
        ({...result, [id]: (attr as AttrFromArgFn<T, A>)(a) }), {})
    })) as AttrFromArgFn<P, A>

  } else {
    return {
      [sel.name]: sel.ids.reduce((result, id, i) =>
        ({...result, [id]: getAttrEntry(sel, arg, attr, i) }), {})
    } as P
  }
}

const getFullAttributes = <T extends InputElementAttr, R extends InputElementAttr, A>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: AttrFromArg<T, A>): R => {

  if (sel.parent === undefined) return getAttrEntry(sel, arg, attr, 0) as unknown as R
  else return getFullAttributes(sel.parent, arg, createParentAttr(sel, arg, attr))
}

export const attrEvent = <T extends InputElementAttr, A>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: (a: A) => T): events.IDispatchUpdate | events.IDispatchHighlight => {

  const eventData = {
    attributes: getFullAttributes<T, InputCanvasAttr, A>(sel, arg, attr),
    animation: sel.animation
  }
  if (sel.highlight)
    return { type: events.EnumDispatchType.highlight, queue: sel.queue, data: eventData }
  else
    return { type: events.EnumDispatchType.update, queue: sel.queue, data: eventData }
}

type EventQueues = string | number | ReadonlyArray<string | number> | null
export const queueEvent = <T extends InputElementAttr>(sel: ISelContext<T>,
                                                       type: events.IDispatchQueueUpdate['type'],
                                                       queues: EventQueues): events.IDispatchQueueUpdate => {
  const queueList = queues === null ? null : (Array.isArray(queues) ? queues : [queues]).map(q => String(q))
  return {
    type: type,
    queue: sel.queue,
    data: { queues: queueList }
  }
}
