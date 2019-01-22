import { InputElementAttr, InputCanvasAttr, InputCanvasAnimAttr } from '../client/attributes/definitions/types'
import { ISelContext } from './Selection'
import { Omit, isDict, isDictEmpty } from '../client/utils'
import { ElementArg, ElementFn } from './types/types'
import { IAnimation } from '../client/attributes/definitions/animation'
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

  if (typeof attr === 'function' && sel.data === null) {
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

export const createFullAttr = <T extends InputElementAttr, A, R extends InputElementAttr>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: AttrFromArg<T, A>): R => {

  if (sel.parent === undefined) return getAttrEntry(sel, arg, attr, 0) as unknown as R
  else return createFullAttr(sel.parent, arg, createParentAttr(sel, arg, attr))
}

export const attrEvent = <T extends InputElementAttr, A>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: (a: A) => T): events.IDispatchUpdate | events.IDispatchHighlight => {

  const eventData = {
    attributes: createFullAttr<T, A, InputCanvasAttr>(sel, arg, attr),
    animation: sel.animation
  }
  if (sel.highlight) return { type: 'highlight', queue: sel.queue, data: eventData }
  else return { type: 'update', queue: sel.queue, data: eventData }
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

export const mergeDictRec = (a: object, b: object): object => {
  const merged = Object.keys(a).reduce((res, k) =>
    ({...res, [k]: isDict(a[k]) && isDict(b[k]) ? mergeDictRec(a[k], b[k]) : b[k] !== undefined ? b[k] : a[k] }), {})
  return {...b, ...merged }
}

export const updateAnimation = <T extends InputElementAttr, A>
  (sel: ISelContext<T>, arg: ElementArg<A>, attr: (a: A) => Partial<IAnimation>): InputCanvasAnimAttr => {

  if ((isDictEmpty(sel.animation) || Object.keys(sel.animation).length === 1 && sel.animation['**'] !== undefined)
    && typeof arg !== 'function')
    // optimization to minimize the amount of transmitted data
    return mergeDictRec(sel.animation, { '**': attr(arg) })
  else {
    const animationAttr = createFullAttr(sel, arg, (a: A) => ({ '**': attr(a) }) as unknown as T) as InputCanvasAnimAttr
    return mergeDictRec(sel.animation, animationAttr)
  }
}
