import { ICanvasAttr } from './attributes/definitions/canvas'
import { PartialAttr, AttrEval } from './attributes/types'
import { RenderBehavior } from './render/canvas/behavior'
import { ISchedulerState, ISchedulerTask } from './scheduler'
import { Canvas, ReceiveEvent, DispatchEvent, EnumDispatchType } from './types/events'
import * as scheduler from './scheduler'
import * as renderCanvasLive from './render/canvas/live'
import * as layout from './layout/layout'
import * as clientEvents from './events'

export interface IClientState {
  readonly canvas: Canvas
  readonly scheduler: ISchedulerState
  readonly expressions?: PartialAttr<ICanvasAttr>
  readonly attributes?: AttrEval<ICanvasAttr>
  readonly layout: layout.ILayoutState
  readonly renderBehavior?: RenderBehavior
}

export type ClientListener = (event: ReceiveEvent) => void

export interface Client {
  onReceive (listener: ClientListener): void
  dispatch (event: DispatchEvent): void

  /* tslint:disable */
  state: IClientState
  listener: ClientListener
  /* tslint:enable */

  setState (state: IClientState): void

  tick (): void

  receiveEvent (event: DispatchEvent, queue: DispatchEvent['queue']): void
  executeEvent (event: DispatchEvent): void
}

const init = (canvas: Canvas, receiveEvent: Client['receiveEvent'], tick: Client['tick']): IClientState => {
  return {
    canvas: canvas,
    scheduler: scheduler.init(receiveEvent),
    expressions: undefined,
    attributes: undefined,
    layout: layout.init(tick),
    renderBehavior: undefined
  }
}

export const client = (canvas: Canvas): Client => {
  const buildClient = (self: () => Client): Client => ({
    state: undefined,
    listener: undefined,

    setState: state => {
      /* tslint:disable */
      self().state = state
      /* tslint:enable */
    },
    onReceive: fn => {
      /* tslint:disable */
      self().listener = fn
      /* tslint:enable */
    },

    dispatch: event => {
      const task = scheduler.schedule(self().state.scheduler, event.queue, event)
      self().setState({...self().state, scheduler: task.state })
      task.execute()
    },

    receiveEvent: (event, queue) => {
      const schedulerState = self().state.scheduler
      const task = scheduler.execute(schedulerState, queue, event, self().executeEvent)
      self().setState({...self().state, scheduler: task.state })
      task.execute()
    },
    executeEvent: event => {
      const state = clientEvents.executeEvent(self().state, self().listener, event)
      self().setState(state)
    },

    tick: () => {
      const state = self().state
      renderCanvasLive.updateCanvas(canvas, state.attributes, state.layout)
    }
  })

  const newClient = buildClient(() => newClient)
  newClient.setState(init(canvas, newClient.receiveEvent, newClient.tick))
  return newClient
}
