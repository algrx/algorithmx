import { ICanvasAttr } from '../../attributes/definitions/canvas'
import { Canvas } from '../../types/events'
import { D3Selection } from '../utils'
import { ILayoutState } from '../../layout/layout'
import * as canvasUtils from './utils'
import * as liveEdge from '../edge/live'
import * as math from '../../math'

const updateNodes = (selection: D3Selection, layout: ILayoutState): void => {
  const nodeGroup = canvasUtils.selectNodeGroup(canvasUtils.selectCanvasInner(selection))

  Object.entries(layout.nodes).forEach(([id, node]) => {
    const nodeSel = canvasUtils.selectNode(nodeGroup, id)
    nodeSel.attr('transform', `translate(${node.x},${-node.y})`)
  })
}

const updateEdges = (selection: D3Selection, attr: ICanvasAttr, layout: ILayoutState): void => {
  const edgeGroup = canvasUtils.selectEdgeGroup(canvasUtils.selectCanvasInner(selection))
  // const nodeGroup = canvasUtils.selectNodeGroup(canvasUtils.selectCanvasInner(selection))

  Object.keys(attr.edges).forEach((id) => {
    const edge = liveEdge.getLiveEdgeData(layout, attr, id)
    const edgeSel = canvasUtils.selectEdge(edgeGroup, id)

    const origin = liveEdge.getEdgeOrigin(edge)
    edgeSel.attr('transform', `translate(${origin[0]},${-origin[1]})rotate(${-math.angleToDeg(edge.angle)})`)

    liveEdge.renderEdgePath(edgeSel, edge, origin)
  })
}

export const updateCanvas = (canvas: Canvas, attr: ICanvasAttr, layout: ILayoutState): void => {
  const canvasSel = canvasUtils.selectCanvas(canvas)
  updateNodes(canvasSel, layout)
  updateEdges(canvasSel, attr, layout)
}
