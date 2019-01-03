import { ISelContext } from './Selection'
import { Omit } from '../client/utils'
import { Attr, InputAttr } from '../client/attributes/types'
import { ElementArg, ElementFn } from './types/types'
import { ICanvasAttr } from '../client/attributes/definitions/canvas'
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

const processAttr = (attr: unknown, data: unknown, index: number) => {
  if (typeof attr === 'function') return attr(data, index)

  else if (typeof attr === 'object' && attr !== null && !Array.isArray(attr)) {
    return Object.entries(attr).reduce((result, [k, v]) =>
      ({...result, [k]: processAttr(v, data, index) }), {})

  } else if (Array.isArray(attr)) {
    return attr.map(v => processAttr(v, data, index))

  } else return attr
}

type AttrFromArgFn<T extends Attr, A> = ((d: A) => InputAttr<T>)
type AttrFromArg<T extends Attr, A> = InputAttr<T> | AttrFromArgFn<T, A>

const getAttrEntry = <T extends Attr, A> (sel: ISelContext<T>, arg: ElementArg<A>, attr: AttrFromArg<T, A>,
                                          index: number): InputAttr<T> => {
  if (typeof attr === 'function') {
    const evalArg = typeof arg === 'function'
      ? ((arg as ElementFn<A>)(sel.data[index], index))
      : arg
    return (attr as AttrFromArgFn<T, A>)(evalArg)
  } else return attr
}

const createParentAttr = <T extends Attr, P extends Attr, A>
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
    } as InputAttr<P>
  }
}

const getFullAttributes = <T extends Attr, R extends Attr, A>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: AttrFromArg<T, A>): InputAttr<R> => {

  if (sel.parent === undefined) return getAttrEntry(sel, arg, attr, 0) as unknown as InputAttr<R>
  else return getFullAttributes(sel.parent, arg, createParentAttr(sel, arg, attr))
}

export const attrEvent = <T extends Attr, A>(sel: ISelContext<T>, arg: ElementArg<A>,
                                             attr: (a: A) => InputAttr<T>):
                                             events.IDispatchUpdate | events.IDispatchHighlight => {
  const eventData = {
    attributes: getFullAttributes<T, ICanvasAttr, A>(sel, arg, attr),
    animation: sel.animation
  }
  if (sel.highlight)
    return { type: events.EnumDispatchType.highlight, queue: sel.queue, data: eventData }
  else
    return { type: events.EnumDispatchType.update, queue: sel.queue, data: eventData }
}

export const queueEvent = <T extends Attr>(sel: ISelContext<T>, type: events.IDispatchEventQueueUpdate['type'],
                                           queue: string | number | null): events.IDispatchEventQueueUpdate => {
  return {
    type: type,
    queue: sel.queue,
    data: { queue: queue === null ? null : String(queue) }
  }
}
