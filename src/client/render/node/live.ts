import { INodeAttr, Shape } from '../../attributes/definitions/node'
import { D3Selection } from '../utils'
import { ILayoutState } from '../../layout/layout'
import * as attrNode from '../../attributes/definitions/node'
import * as renderNode from './render'

export interface IRenderLiveNode {
  readonly id: string
  readonly shape: Shape
  readonly size: [number, number]
  readonly pos: [number, number]
}

export const getLiveNodeData = (layout: ILayoutState, nodeAttr: INodeAttr, id: string): IRenderLiveNode => {
  const nodeLayout = layout.nodes[id]
  return {
    id: id,
    shape: nodeAttr.shape,
    size: [nodeLayout.width / 2, nodeLayout.height / 2],
    pos: [nodeLayout.x, nodeLayout.y]
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
export const getActualSize = (selection: D3Selection, attr: INodeAttr): [number, number] => {
  const shapeSel = renderNode.selectNodeInner(selection).select('.shape')
  if (attr.shape === Shape.Circle) {
    const r = parseFloat(shapeSel.attr('r'))
    return [r, r]
  } else if (attr.shape === Shape.Rect)
    return [parseFloat(shapeSel.attr('width')) / 2, parseFloat(shapeSel.attr('height')) / 2]
  else if (attr.shape === Shape.Ellipse)
    return [parseFloat(shapeSel.attr('rx')), parseFloat(shapeSel.attr('ry'))]
  else return [0, 0]
}

export const getActualPos = (selection: D3Selection): [number, number] => {
  const transform = selection.attr('transform')
  const pos = transform.substr(10, transform.length - 11).split(',')
  return [parseFloat(pos[0]), -parseFloat(pos[1])]
}
*/
