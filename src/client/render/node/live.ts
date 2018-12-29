import { INodeAttr, Shape } from '../../attributes/definitions/node'
import { D3Selection } from '../utils'
import { NodeLayout } from '../../layout/node'
import * as attrNode from '../../attributes/definitions/node'

export interface IRenderLiveNode {
  readonly shape: Shape
  readonly size: [number, number]
  readonly pos: [number, number]
}

export const getLiveNodeData = (layout: NodeLayout, attr: INodeAttr): IRenderLiveNode => {
  return {
    shape: attr.shape,
    size: [layout.width / 2, layout.height / 2],
    pos: [layout.x, layout.y]
  }
}

export const getLiveNodeDataWithSel = (sel: D3Selection, layout: NodeLayout, attr: INodeAttr): IRenderLiveNode => {
  const selWidth = sel.attr('_width')
  const selHeight = sel.attr('_height')

  const size: [number, number] = selWidth !== null && selHeight !== null
    ? [parseFloat(selWidth), parseFloat(selHeight)]
    : [layout.width / 2, layout.height / 2]

  return {
    shape: attr.shape,
    size: size,
    pos: [layout.x, layout.y]
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
