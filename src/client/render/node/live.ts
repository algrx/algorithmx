import { ICanvasAttr } from '../../attributes/definitions/canvas'
import { Shape } from '../../attributes/definitions/node'
import { ILayoutState } from '../../layout/layout'
import { D3Selection } from '../utils'
import { AttrEval } from '../../attributes/types'
import * as renderCanvasUtils from '../canvas/utils'
import * as attrNode from '../../attributes/definitions/node'

export interface IRenderLiveNode {
  readonly shape: Shape
  readonly size: [number, number]
  readonly pos: [number, number]
}

export const getLiveNodeData = (canvasSel: D3Selection, layoutState: ILayoutState,
                                canvasAttr: AttrEval<ICanvasAttr>, nodeId: string): IRenderLiveNode => {
  const nodeGroup = renderCanvasUtils.selectNodeGroup(canvasSel)

  const nodeAttr = canvasAttr.nodes[nodeId]
  const nodeLayout = layoutState.nodes[nodeId]

  if (nodeAttr.visible) {
    const nodeSel = renderCanvasUtils.selectNode(nodeGroup, nodeId)
    const selWidth = nodeSel.attr('_width')
    const selHeight = nodeSel.attr('_height')

    const size: [number, number] = selWidth !== null && selHeight !== null
      ? [parseFloat(selWidth), parseFloat(selHeight)]
      : [nodeLayout.width / 2, nodeLayout.height / 2]

    return {
      shape: nodeAttr.shape,
      size: size,
      pos: [nodeLayout.x, nodeLayout.y]
    }

  } else {
    return {
      shape: nodeAttr.shape,
      size: [nodeLayout.width / 2, nodeLayout.height / 2],
      pos: [nodeLayout.x, nodeLayout.y]
    }
  }
}

export const getPointAtNodeBoundary = (node: IRenderLiveNode, angle: number): [number, number] => {
  const offset = attrNode.radiusAtAngle(angle, node.size[0], node.size[1], node.shape)
  return [
    node.pos[0] + offset * Math.cos(angle),
    node.pos[1] + offset * Math.sin(angle)
  ]
}

/*
export const getActualPos = (selection: D3Selection): [number, number] => {
  const transform = selection.attr('transform')
  const pos = transform.substr(10, transform.length - 11).split(',')
  return [parseFloat(pos[0]), -parseFloat(pos[1])]
}
*/
