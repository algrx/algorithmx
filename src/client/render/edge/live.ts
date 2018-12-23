import { D3Selection } from '../utils'
import { IEdgeAttr, Curve } from '../../attributes/definitions/edge'
import { IRenderLiveNode } from '../node/live'
import { ILayoutState } from '../../layout/layout'
import { ICanvasAttr } from '../../attributes/definitions/canvas'
import * as liveNode from '../node/live'
import * as math from '../../math'
import * as d3 from '../d3.modules'

interface IRenderLiveEdge {
  readonly angle: number
  readonly curve: Curve
  readonly path: ReadonlyArray<[number, number]>
  readonly source: IRenderLiveNode
  readonly target: IRenderLiveNode
}

export const getLiveEdgeData = (layout: ILayoutState, canvasAttr: ICanvasAttr, id: string): IRenderLiveEdge => {
  const edgeAttr = canvasAttr.edges[id]
  const sourceData = liveNode.getLiveNodeData(layout, canvasAttr.nodes[edgeAttr.source], edgeAttr.source)
  const targetData = liveNode.getLiveNodeData(layout, canvasAttr.nodes[edgeAttr.target], edgeAttr.target)
  const angle = Math.atan2(targetData.pos[1] - sourceData.pos[1], targetData.pos[0] - sourceData.pos[0])
  return {
    angle: angle,
    curve: edgeAttr.curve,
    path: edgeAttr.path.map(p => [p.x, p.y] as [number, number]),
    source: sourceData,
    target: targetData
  }
}

export const getEdgeOriginRegular = (edge: IRenderLiveEdge): [number, number] => {
  const sourcePoint = liveNode.getPointAtNodeBoundary(edge.source, edge.angle)
  const targetPoint = liveNode.getPointAtNodeBoundary(edge.target, edge.angle + Math.PI)
  return [
    (sourcePoint[0] + targetPoint[0]) / 2,
    (sourcePoint[1] + targetPoint[1]) / 2
  ]
}

export const getEdgeOriginLoop = (edge: IRenderLiveEdge): [number, number]  => {
  return [0, 0]
}

export const getEdgeOrigin = (edge: IRenderLiveEdge): [number, number]  => {
  if (edge.source.id === edge.target.id) return getEdgeOriginLoop(edge)
  else return getEdgeOriginRegular(edge)
}

export const renderPath = (selection: D3Selection, attr: IEdgeAttr): void => {
  const lineFunction = d3.shape.line().x(d => d[0]).y(d => d[1]).curve(curveFn('linear'))

  selection.select('path').attr('d', lineFunction([[-10, 0], [10, 0]]))
}

export const curveFn = (name: string) => {
  // e.g. convert 'cardinal' to 'curveCardinal'
  return d3.shape['curve' + name.charAt(0).toUpperCase() + name.substr(1)]
}

export const renderEdgePath = (edgeSel: D3Selection, edge: IRenderLiveEdge, origin: [number, number]) => {
  const pointBeforeSource = edge.path.length === 0 ? origin
    : math.translate(math.rotate(edge.path[0], edge.angle), origin)
  const pointBeforeTarget = edge.path.length === 0 ? origin
    : math.translate(math.rotate(edge.path[edge.path.length - 1], edge.angle), origin)

  const angleAtSource = Math.atan2(pointBeforeSource[1] - edge.source.pos[1], pointBeforeSource[0] - edge.source.pos[0])
  const angleAtTarget = Math.atan2(pointBeforeTarget[1] - edge.target.pos[1], pointBeforeTarget[0] - edge.target.pos[0])

  const pointAtSource = liveNode.getPointAtNodeBoundary(edge.source, angleAtSource)
  const pointAtTarget = liveNode.getPointAtNodeBoundary(edge.target, angleAtTarget)

  const pointAtSourceRel = math.rotate(math.translate(pointAtSource, [-origin[0], -origin[1]]), -edge.angle)
  const pointAtTargetRel = math.rotate(math.translate(pointAtTarget, [-origin[0], -origin[1]]), -edge.angle)

  const lineFunction = d3.shape.line().x(d => d[0]).y(d => -d[1]).curve(curveFn(edge.curve))
  edgeSel.select('path').attr('d', lineFunction([pointAtSourceRel, ...edge.path, pointAtTargetRel]))
}
