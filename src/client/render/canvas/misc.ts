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
import * as renderNodeDrag from '../node/drag'

export const renderLayout = (canvas: Canvas, renderData: RenderAttr<ICanvasAttr>, layoutState: ILayoutState): void => {
  const canvasSel = canvasUtils.selectCanvas(canvas)
  const nodeGroup = canvasUtils.selectNodeGroup(canvasUtils.selectCanvasInner(canvasSel))

  renderElement.renderVisibleLookup(getEntry(renderData, 'nodes'), (k, nodeData) => {
    const selection = canvasUtils.selectNode(nodeGroup, k)
    const draggable = getEntry(nodeData, 'draggable').attr

    if (draggable) renderNodeDrag.enableDrag(canvasSel, selection, layoutState.cola, layoutState.nodes[k])
    else renderNodeDrag.disableDrag(selection)
  })
}

export const renderWithLiveUpdate = (canvas: Canvas, renderData: RenderAttr<ICanvasAttr>,
                                     liveUpdate: () => void): void => {
  // changing node size requires the live layout function to be called continuously,
  // so that connected edges are animated as well
  const canvasSel = canvasUtils.selectCanvas(canvas)
  const nodeGroup = canvasUtils.selectNodeGroup(canvasUtils.selectCanvasInner(canvasSel))

  renderElement.renderVisibleLookup(getEntry(renderData, 'nodes'), (k, nodeDataInit) => {
    const nodeData = renderNode.preprocess(renderElement.preprocess(nodeDataInit))
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
