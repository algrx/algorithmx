import { AttrEvalPartial, AttrEval, AttrLookup } from '../attributes/types'
import { ICanvasAttr } from '../attributes/definitions/canvas'
import { Lookup } from '../utils'
import * as layoutCanvas from './canvas'
import * as layoutNode from './node'
import * as layoutEdge from './edge'
import * as webcola from 'webcola'
import * as d3 from '../render/d3.modules'

export interface ILayoutState {
  readonly cola: webcola.Layout
  readonly tick: () => void
  readonly nodes: Lookup<webcola.Node> // fast retrieval of node positions
  readonly adjacentNodes: Lookup<ReadonlyArray<string>> // fast adjacency lookup
}

export const initCola = (tick: (() => void)): webcola.Layout => {
  return webcola.d3adaptor(d3)
    .nodes([]).links([])
    .handleDisconnected(false)
    .avoidOverlaps(true)
    .on('tick', tick)
}

export const init = (tick: (() => void)): ILayoutState => {
  return {
    cola: initCola(tick),
    tick: tick,
    nodes: {},
    adjacentNodes: {}
  }
}

export const reset = (layoutState: ILayoutState): ILayoutState => {
  layoutState.cola.links([]).nodes([]).stop().on('tick', () => { /**/ })
  return init(layoutState.tick)
}

export const update = (layoutState: ILayoutState, attr: AttrEval<ICanvasAttr>,
                       changes: AttrEvalPartial<ICanvasAttr>): ILayoutState => {
  const didUpdateNodes = changes.nodes && Object.entries(changes.nodes).findIndex(([k, v]) =>
    v === null || layoutNode.didUpdateLayout(attr.nodes[k], v)) >= 0
  const didUpdateEdges = changes.edges && Object.values(changes.edges).findIndex(v =>
    v === null || layoutEdge.didUpdateLayout(v)) >= 0
  const didUpdateCanvas = layoutCanvas.didUpdateLayout(changes)

  if (!didUpdateNodes && !didUpdateEdges && !didUpdateCanvas) return layoutState

  const newNodes = didUpdateNodes ? layoutNode.mergeLookup(layoutState.nodes, attr.nodes, changes.nodes)
    : layoutState.nodes

  if (didUpdateNodes) layoutNode.updateCola(layoutState.cola, newNodes)

  // edges need to be re-added when edge length type changes
  if (didUpdateEdges || changes.edgeLengths !== undefined)
    layoutEdge.updateCola(layoutState.cola, newNodes, layoutEdge.createLookup(attr.edges))

  if (didUpdateCanvas) layoutCanvas.updateCola(layoutState.cola, attr)

  const adjacency = didUpdateNodes === undefined && didUpdateEdges === undefined
    ? layoutState.adjacentNodes : layoutCanvas.calcAdjacency(attr.nodes, attr.edges)

  layoutState.cola.start()

  return {...layoutState, nodes: newNodes, adjacentNodes: adjacency }
}
