import { Client } from './types/client'
import { ClassBuilder } from './utils'
import { ReceiveEvent, DispatchEvent, Canvas } from '../client/types/events'
import { canvasSelection } from './CanvasSelection'
import * as clientApp from '../client/client'
import * as utils from './utils'

interface IClientContext {
  readonly app: clientApp.Client
  readonly canvas: Canvas
  /* tslint:disable */
  readonly subscriptions: Array<(event: ReceiveEvent) => void>
  /* tslint:enable */
}

const builder: ClassBuilder<Client, IClientContext> = (context, self) => ({
  dispatch: event => {
    context.app.dispatch(event)
  },
  subscribe: listener => {
    context.subscriptions.push(listener)
    context.app.onReceive(event => {
      context.subscriptions.forEach(fn => fn(event))
    })
  },
  canvas: () => {
    return canvasSelection(context.canvas, self())
  }
})

export const client = (canvas: Canvas): Client => {
  const context: IClientContext = {
    app: clientApp.client(canvas),
    canvas: canvas,
    subscriptions: []
  }
  return utils.build(builder, context)
}
