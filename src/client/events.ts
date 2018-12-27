import { ICanvasAttr } from './attributes/definitions/canvas'
import { RenderAttr } from './render/process'
import { IClientState, ClientListener } from './client'
import * as events from './types/events'
import * as pipeline from './pipeline/pipeline'
import * as renderCanvas from './render/canvas/render'
import * as renderCanvasBehavior from './render/canvas/behavior'
import * as renderCanvasListeners from './render/canvas/listeners'
import * as renderCanvasLive from './render/canvas/live'
import * as layout from './layout/layout'

export const dispatchError = (message: string, type: events.ErrorType): events.IReceiveEventError =>
  ({ type: events.ReceiveEventType.Error, data: { message: message, type: type } })

const dispatchClick = (nodeId: string): events.IReceiveEventClick =>
  ({ type: events.ReceiveEventType.Click, data: { id: nodeId } })

const dispatchHover = (nodeId: string, entered: boolean): events.IReceiveEventHover =>
  ({ type: events.ReceiveEventType.Hover, data: { id: nodeId, entered: entered } })

const executeReset = (state: IClientState, listener: ClientListener,
                      event: events.IDispatchEventUpdate): IClientState => {
  if (state.attributes === undefined) return state

  const processed = pipeline.processReset(state.attributes, event.data)
  if (processed instanceof Error) {
    listener(dispatchError(processed.message, events.ErrorType.Attribute))
    return state
  }

  const renderData = pipeline.getRenderData(processed)
  renderCanvas.renderCanvas(state.canvas, renderData)

  return {...state,
    expressions: undefined,
    attributes: undefined,
    layout: layout.reset(state.layout),
    renderBehavior: undefined
  }
}

const executeUpdate = (state: IClientState, listener: ClientListener,
                       event: events.IDispatchEventUpdate): IClientState => {
  if (event.data.attributes === null) return executeReset(state, listener, event)

  const processed = pipeline.processUpdate(state.canvas, state.attributes, state.expressions, event.data)
  if (processed instanceof Error) {
    listener(dispatchError(processed.message, events.ErrorType.Attribute))
    return state
  }

  const renderData = pipeline.getRenderData(processed)
  const layoutState = layout.update(state.layout, processed.attributes, processed.changes)

  renderCanvas.renderCanvas(state.canvas, renderData)
  renderCanvas.renderLayout(state.canvas, renderData, layoutState)
  renderCanvasLive.updateCanvas(state.canvas, processed.attributes, layoutState)

  const clickFn = (n: string) => listener(dispatchClick(n))
  const hoverFn = (n: string, h: boolean) => listener(dispatchHover(n, h))

  renderCanvasListeners.registerNodeClick(state.canvas, renderData, clickFn)
  renderCanvasListeners.registerNodeHover(state.canvas, renderData, hoverFn)

  const renderBehavior = renderCanvasBehavior.update(state.canvas, renderData, state.renderBehavior)
  renderCanvasBehavior.render(state.canvas, renderData, renderBehavior)

  return {...state,
    expressions: processed.expressions,
    attributes: processed.attributes,
    layout: layoutState,
    renderBehavior: renderBehavior
  }
}

const executeHighlight = (state: IClientState, listener: ClientListener,
                          event: events.IDispatchEventHighlight): void => {
  const processed = pipeline.processHighlight(state.attributes, state.expressions, event.data)
  if (processed instanceof Error) {
    listener(dispatchError(processed.message, events.ErrorType.Attribute))
    return
  }

  const renderData: RenderAttr<ICanvasAttr> = {
    name: 'canvas',
    attr: state.attributes,
    animation: processed.animation,
    highlight: processed.changes
  }

  renderCanvas.renderCanvas(state.canvas, renderData)
  renderCanvasLive.updateCanvas(state.canvas, state.attributes, state.layout)
  renderCanvasBehavior.render(state.canvas, renderData, state.renderBehavior)
}

export const executeEvent = (state: IClientState, listener: ClientListener,
                             event: events.DispatchEvent): IClientState => {
  if (event.type === events.DispatchEventType.Broadcast) {
    listener({
      type: events.ReceiveEventType.Broadcast,
      data: { message: event.data.message }
    })
    return state

  } else if (event.type === events.DispatchEventType.Update) {
    return executeUpdate(state, listener, event)

  } else if (event.type === events.DispatchEventType.Highlight) {
    executeHighlight(state, listener, event)
    return state

  } else return state
}
