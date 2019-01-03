import { ICanvasAttr } from '../../attributes/definitions/canvas'
import { RenderAttr } from '../process'
import { Canvas } from '../../types/events'
import { getEntry } from '../process'
import { D3Selection, D3Zoom } from '../utils'
import * as canvasUtils from './utils'
import * as renderProcess from '../process'
import * as renderFns from '../render'
import * as d3 from '../d3.modules'

export interface RenderBehavior {
  readonly zoom: D3Zoom
}

const updatePanZoomLimit = (selection: D3Selection, renderData: RenderAttr<ICanvasAttr>,
                            behavior: RenderBehavior['zoom'] | undefined): RenderBehavior['zoom'] => {
  if (renderProcess.hasChanged(getEntry(renderData, 'zoomLimit'))
      || renderProcess.hasChanged(getEntry(renderData, 'panLimit'))
      || behavior === undefined) {

    const onZoom = () => canvasUtils.selectCanvasInner(selection)
      .attr('transform', d3.event ? d3.event.transform : '')

    const panH = renderData.attr.panLimit.horizontal
    const panV = renderData.attr.panLimit.vertical
    const newBehavior = d3.zoom()
      .translateExtent([[-panH, -panV], [panH, panV]])
      .scaleExtent([renderData.attr.zoomLimit.min, renderData.attr.zoomLimit.max])
      .on('zoom', onZoom)

    selection.call(newBehavior)
    return newBehavior

  } else return behavior
}

const updatePanZoom = (selection: D3Selection, renderData: RenderAttr<ICanvasAttr>,
                       behavior: RenderBehavior | undefined): RenderBehavior => {
  const zoomBehavior = updatePanZoomLimit(selection, renderData, behavior ? behavior.zoom : undefined)
  return {...behavior, zoom: zoomBehavior }
}

const renderPanZoom = (selection: D3Selection, renderData: RenderAttr<ICanvasAttr>,
                       behavior: RenderBehavior): void => {
  const zoomBehavior = behavior.zoom

  const panPos = renderProcess.flatten(getEntry(renderData, 'pan'))
  renderFns.render(selection, panPos, (sel, pan) => {
    return (sel as D3Selection).call(zoomBehavior.translateTo, pan.x, pan.y)
  })

  renderFns.render(selection, getEntry(renderData, 'zoom'), (sel, z) => {
    return (sel as D3Selection).call(zoomBehavior.scaleTo, z)
  })
}

export const update = (canvas: Canvas, renderData: RenderAttr<ICanvasAttr>,
                       behavior: RenderBehavior | undefined): RenderBehavior => {
  return updatePanZoom(canvasUtils.selectCanvas(canvas), renderData, behavior)
}

export const render = (canvas: Canvas, renderData: RenderAttr<ICanvasAttr>,
                       behavior: RenderBehavior): void => {
  renderPanZoom(canvasUtils.selectCanvas(canvas), renderData, behavior)
}
