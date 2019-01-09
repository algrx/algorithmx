import { Canvas } from '../../types/events'
import { ICanvasAttr } from '../../attributes/definitions/canvas'
import { RenderAttr } from '../process'
import { getEntry } from '../process'
import * as renderFns from '../render'
import * as renderUtils from '../utils'
import * as canvasUtils from './utils'
import * as renderElement from '../element'
import * as renderNode from '../node/render'
import * as renderEdge from '../edge/render'
import * as renderLabel from '../label/render'

export const renderVisible: renderFns.RenderAttrFn<ICanvasAttr['visible']> = (selection, renderData) => {
  renderElement.renderVisible(selection, renderData)
}

const render: renderFns.RenderAttrFn<ICanvasAttr> = (selection, renderData) => {
  renderElement.renderSvgAttr(selection, 'width', v => v, getEntry(getEntry(renderData, 'size'), 'width'))
  renderElement.renderSvgAttr(selection, 'height', v => v, getEntry(getEntry(renderData, 'size'), 'height'))

  // add an invisible rectangle to fix zooming on safari
  if (renderUtils.isSafari()) canvasUtils.selectSafariFix(selection)

  const canvasInner = canvasUtils.selectCanvasInner(selection)
  const labelGroup = canvasUtils.selectLabelGroup(canvasInner)
  const edgeGroup = canvasUtils.selectEdgeGroup(canvasInner)
  const nodeGroup = canvasUtils.selectNodeGroup(canvasInner)

  renderElement.renderElementLookup(k => canvasUtils.selectNode(nodeGroup, k), getEntry(renderData, 'nodes'),
    renderNode.render, renderNode.renderVisible)

  renderElement.renderElementLookup(k => canvasUtils.selectEdge(edgeGroup, k), getEntry(renderData, 'edges'),
    renderEdge.render, renderEdge.renderVisible)

  renderElement.renderElementLookup(k => canvasUtils.selectLabel(labelGroup, k), getEntry(renderData, 'labels'),
    renderLabel.render, renderLabel.renderVisible)

  renderElement.renderSvgMixin(selection, renderData)
}

export function renderCanvas (canvas: Canvas, renderData: RenderAttr<ICanvasAttr>): void {
  renderElement.renderElement(() => canvasUtils.selectCanvas(canvas), renderData, render, renderVisible)
}
