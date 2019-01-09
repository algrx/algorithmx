import { ICanvasAttr } from './attributes/definitions/canvas'
import { RenderAttr } from './render/process'
import { IClientState, ClientListener } from './client'
import { RenderBehavior } from './render/canvas/behavior'
import * as events from './types/events'
import * as pipeline from './pipeline/pipeline'
import * as renderElement from './render/element'
import * as renderCanvas from './render/canvas/render'
import * as renderCanvasBehavior from './render/canvas/behavior'
import * as renderCanvasListeners from './render/canvas/listeners'
import * as renderCanvasLive from './render/canvas/live'
import * as renderCanvasMisc from './render/canvas/misc'
import * as layout from './layout/layout'

export const dispatchError = (message: string, type: events.EnumErrorType): events.IReceiveError =>
  ({ type: events.EnumReceiveType.error, data: { message: message, type: type } })

const dispatchClick = (nodeId: string): events.IReceiveClick =>
  ({ type: events.EnumReceiveType.click, data: { id: nodeId } })

const dispatchHover = (nodeId: string, entered: boolean): events.IReceiveHover =>
  ({ type: events.EnumReceiveType.hover, data: { id: nodeId, entered: entered } })

const executeReset = (state: IClientState, listener: ClientListener,
                      event: events.IDispatchUpdate): IClientState => {
  if (state.attributes === undefined) return state

  const processed = pipeline.processReset(state.attributes, event.data)
  if (processed instanceof Error) {
    listener(dispatchError(processed.message, events.EnumErrorType.attribute))
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

const render = (canvas: events.Canvas, renderData: RenderAttr<ICanvasAttr>,
                layoutState: layout.ILayoutState): void => {
  renderCanvas.renderCanvas(canvas, renderData)
  if (renderData.attr.visible === false) return

  renderCanvasMisc.renderLayout(canvas, renderData, layoutState)

  const updateLiveFn = () => renderCanvasLive.updateCanvas(canvas, renderData.attr, layoutState)
  renderCanvasMisc.renderWithLiveUpdate(canvas, renderData, updateLiveFn)
  updateLiveFn()
}

const renderBehavior = (canvas: events.Canvas, renderData: RenderAttr<ICanvasAttr>,
                        behavior: RenderBehavior): RenderBehavior => {
  if (renderData.attr.visible === false) return behavior

  const newBehavior = renderCanvasBehavior.update(canvas, renderData, behavior)
  renderCanvasBehavior.render(canvas, renderData, newBehavior)

  return newBehavior
}

const executeUpdate = (state: IClientState, listener: ClientListener,
                       event: events.IDispatchUpdate): IClientState => {
  if (event.data.attributes === null) return executeReset(state, listener, event)

  const processed = pipeline.processUpdate(state.canvas, state.attributes, state.expressions, event.data)
  if (processed instanceof Error) {
    listener(dispatchError(processed.message, events.EnumErrorType.attribute))
    return state
  }

  const renderData = renderElement.preprocess(pipeline.getRenderData(processed))
  const layoutState = layout.update(state.layout, processed.attributes, processed.changes)

  render(state.canvas, renderData, layoutState)
  const newBehavior = renderBehavior(state.canvas, renderData, state.renderBehavior)

  if (processed.attributes.visible) {
    const clickFn = (n: string) => listener(dispatchClick(n))
    const hoverFn = (n: string, h: boolean) => listener(dispatchHover(n, h))
    renderCanvasListeners.registerNodeClick(state.canvas, renderData, clickFn)
    renderCanvasListeners.registerNodeHover(state.canvas, renderData, hoverFn)
  }

  return {...state,
    expressions: processed.expressions,
    attributes: processed.attributes,
    layout: layoutState,
    renderBehavior: newBehavior
  }
}

const executeHighlight = (state: IClientState, listener: ClientListener,
                          event: events.IDispatchHighlight): void => {
  const processed = pipeline.processHighlight(state.attributes, state.expressions, event.data)
  if (processed instanceof Error) {
    listener(dispatchError(processed.message, events.EnumErrorType.attribute))
    return
  }

  const renderDataInit: RenderAttr<ICanvasAttr> = {
    name: 'canvas',
    attr: state.attributes,
    animation: processed.animation,
    highlight: processed.changes
  }
  const renderData = renderElement.preprocess(renderDataInit)

  render(state.canvas, renderData, state.layout)
  renderBehavior(state.canvas, renderData, state.renderBehavior)
}

export const executeEvent = (state: IClientState, listener: ClientListener,
                             event: events.DispatchEvent): IClientState => {
  if (event.type === events.EnumDispatchType.broadcast) {
    listener({
      type: events.EnumReceiveType.broadcast,
      data: { message: event.data.message }
    })
    return state

  } else if (event.type === events.EnumDispatchType.update) {
    return executeUpdate(state, listener, event)

  } else if (event.type === events.EnumDispatchType.highlight) {
    executeHighlight(state, listener, event)
    return state

  } else return state
}
