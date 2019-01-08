import { Canvas } from '../../types/events'
import { ICanvasAttr } from '../../attributes/definitions/canvas'
import { RenderAttr, IRender } from '../process'
import { getEntry } from '../process'
import { ILayoutState } from '../../layout/layout'
import * as renderFns from '../render'
import * as renderUtils from '../utils'
import * as canvasUtils from './utils'
import * as renderElement from '../element'
import * as renderNode from '../node/render'
import * as renderEdge from '../edge/render'
import * as renderLabel from '../label/render'
import * as renderDrag from '../node/drag'

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

export const renderLayout = (canvas: Canvas, renderData: RenderAttr<ICanvasAttr>, layoutState: ILayoutState): void => {
  const canvasSel = canvasUtils.selectCanvas(canvas)
  const nodeGroup = canvasUtils.selectNodeGroup(canvasUtils.selectCanvasInner(canvasSel))

  renderElement.renderVisibleLookup(getEntry(renderData, 'nodes'), (k, nodeData) => {
    const sel = canvasUtils.selectNode(nodeGroup, k)
    const draggable = getEntry(nodeData, 'draggable').attr
    if (draggable) renderDrag.enableDrag(canvasSel, sel, layoutState.cola, layoutState.nodes[k])
    else renderDrag.disableDrag(sel)
  })
}

export const renderWithLiveUpdate = (canvas: Canvas, renderData: RenderAttr<ICanvasAttr>,
                                     liveUpdate: () => void): void => {
  // changing node size requires the live layout function to be called continuously,
  // so that connected edges are animated as well

  const canvasSel = canvasUtils.selectCanvas(canvas)
  const nodeGroup = canvasUtils.selectNodeGroup(canvasUtils.selectCanvasInner(canvasSel))

  renderElement.renderVisibleLookup(getEntry(renderData, 'nodes'), (k, nodeDataInit) => {
    const nodeData = renderNode.preprocessRenderData(nodeDataInit)
    const selection = canvasUtils.selectNode(nodeGroup, k)

    const width = getEntry(getEntry(nodeData, 'size'), 'width')
    const shape = getEntry(nodeData, 'shape')
    const height: IRender<number> = shape.attr === 'circle' ? {...width, name: 'height' }
      : getEntry(getEntry(nodeData, 'size'), 'height')

    renderFns.render(selection, width, (liveSel, w) => {
      if (renderUtils.isTransition(liveSel))
        return liveSel.attr('_width', w).tween(name, () => () => { liveUpdate() })
      else return liveSel.attr('_width', w)
    })
    renderFns.render(selection, height, (liveSel, h) => {
      if (renderUtils.isTransition(liveSel))
        return liveSel.attr('_height', h).tween(name, () => () => { liveUpdate() })
      else return liveSel.attr('_height', h)
    })
  })
}
