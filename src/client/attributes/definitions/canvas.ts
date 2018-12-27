import { AnimationFull } from './animation'
import { ICommonAttr } from './common'
import { ILabelAttr, Align } from './label'
import { INodeAttr } from './node'
import { IEdgeAttr } from './edge'
import { AttrType } from '../definitions'
import { PartialAttr, AttrLookup, AttrNum, AttrString, VarSymbol, AttrEvalPartial } from '../types'
import * as attrNode from './node'
import * as attrEdge from './edge'
import * as attrLabel from './label'
import * as attrAnim from './animation'
import * as attrCommon from './common'
import * as attrDef from '../definitions'
import * as attrExpr from '../expressions'
import * as attrUtils from '../utils'
import * as utils from '../../utils'

export interface ICanvasAttr extends ICommonAttr {
  readonly nodes: AttrLookup<INodeAttr>
  readonly edges: AttrLookup<IEdgeAttr>
  readonly labels: AttrLookup<ILabelAttr>
  readonly size: {
    readonly width: AttrNum
    readonly height: AttrNum
  }
  readonly edgeLengths: {
    readonly type: AttrString & LengthType
    readonly length: AttrNum
  }
  readonly pan: {
    readonly x: AttrNum
    readonly y: AttrNum
  }
  readonly zoom: AttrNum
  readonly panLimit: {
    readonly horizontal: AttrNum
    readonly vertical: AttrNum
  }
  readonly zoomLimit: {
    readonly min: AttrNum
    readonly max: AttrNum
  }
}

export enum LengthType {
  Individual = 'individual',
  Symmetric = 'symmetric',
  Jaccard = 'jaccard'
}
export type LengthTypeValue = 'individual' | 'symmetric' | 'jaccard'

export const definition = attrDef.extendRecordDef<ICanvasAttr, ICommonAttr>({
  type: AttrType.Record,
  entries: {
    nodes: { type: AttrType.Lookup, entry: attrNode.definition },
    edges: { type: AttrType.Lookup, entry: attrEdge.definition },
    labels: { type: AttrType.Lookup, entry: attrLabel.definition },
    size: { type: AttrType.Record, entries: {
      width: { type: AttrType.Number, symbol: VarSymbol.CanvasWidth },
      height: { type: AttrType.Number, symbol: VarSymbol.CanvasHeight }
    }, keyOrder: ['width', 'height'] },
    edgeLengths: { type: AttrType.Record, entries: {
      type: { type: AttrType.String, validValues: utils.enumValues(LengthType) },
      length: { type: AttrType.Number }
    }, keyOrder: ['type', 'length'] },
    pan: { type: AttrType.Record, entries: {
      x: { type: AttrType.Number },
      y: { type: AttrType.Number }
    }, keyOrder: ['x', 'y'] },
    zoom: { type: AttrType.Number },
    panLimit: { type: AttrType.Record, entries: {
      horizontal: { type: AttrType.Number },
      vertical: { type: AttrType.Number }
    }, keyOrder: ['horizontal', 'vertical'] },
    zoomLimit: { type: AttrType.Record, entries: {
      min: { type: AttrType.Number },
      max: { type: AttrType.Number }
    }, keyOrder: ['min', 'max'] }
  },
  keyOrder: ['nodes', 'edges', 'labels', 'size', 'edgeLengths', 'pan', 'zoom', 'panLimit', 'zoomLimit'],
  validVars: [VarSymbol.CanvasWidth, VarSymbol.CanvasHeight]
}, attrCommon.definition)

export const defaults: ICanvasAttr = {
  ...attrCommon.defaults,
  nodes: {} as AttrLookup<INodeAttr>,
  edges: {} as AttrLookup<IEdgeAttr>,
  labels: {} as AttrLookup<ILabelAttr>,
  size: { width: 100, height: 100 },
  edgeLengths: {
    type: LengthType.Jaccard,
    length: 70
  },
  pan: { x: 0, y: 0 },
  zoom: 1,
  panLimit: { horizontal: Infinity, vertical: Infinity },
  zoomLimit: { min: 0.1, max: 10 }
}

const labelDefaults: PartialAttr<ILabelAttr> = {
  align: Align.Center,
  pos: { x: 0, y: { m: 0.5, x: VarSymbol.CanvasHeight, c: 0 } },
  rotate: true,
  color: 'rgb(50,50,50)',
  size: 20
}

export const animationDefaults: PartialAttr<AnimationFull<ICanvasAttr>> = {
  ...attrCommon.animationDefaults,
  nodes: { '*': attrNode.animationDefaults },
  edges: { '*': attrEdge.animationDefaults },
  labels: { '*': attrLabel.animationDefaults },
  size: {
    width: { duration: 0 },
    height: { duration: 0 }
  }
}

export const init = (canvasSize: [number, number]): ICanvasAttr => {
  return {...defaults,
    size: { width: canvasSize[0], height: canvasSize[1] }
  }
}

export const initChildren = (prevAttr: ICanvasAttr, changes: PartialAttr<ICanvasAttr>): PartialAttr<ICanvasAttr> => {
  const newNodes = utils.mapDict(attrUtils.newLookupEntries(prevAttr.nodes, changes.nodes), (k, node, i) => {
    const initNode = attrNode.init(k as string, Object.keys(prevAttr.nodes).length + i)
    const initNodeChildren = attrNode.initChildren(initNode, node)
    return attrUtils.merge(initNode, initNodeChildren, attrNode.definition)
  })
  const newEdges = attrEdge.getLookupDefaults(prevAttr.edges, changes.edges)
  const newLabels = utils.mapDict(attrUtils.newLookupEntries(prevAttr.labels, changes.labels), k =>
    ({...attrLabel.init(k as string), ...labelDefaults }))

  const nodeChildrenInit = attrUtils.reduceChanges<ICanvasAttr['nodes']>(changes.nodes || {},
    definition.entries.nodes, (k, v) => prevAttr.nodes[k] ? attrNode.initChildren(prevAttr.nodes[k], v) : {})

  const edgeChildrenInit = attrUtils.reduceChanges<ICanvasAttr['edges']>(changes.edges || {},
    definition.entries.edges, (k, v) => prevAttr.edges[k] ? attrEdge.initChildren(prevAttr.edges[k], v) : {})

  return {
    nodes: {...nodeChildrenInit, ...newNodes },
    edges: {...edgeChildrenInit, ...newEdges },
    labels: {...changes.labels, ...newLabels }
  }
}

export const evaluate = (evaluated: AttrEvalPartial<ICanvasAttr>, expr: PartialAttr<ICanvasAttr>,
                         changes: PartialAttr<ICanvasAttr>): AttrEvalPartial<ICanvasAttr> => {
  const evalChanges = attrExpr.getEvaluatedChanges(expr, getVariables(evaluated), definition)
  const newEval = attrUtils.merge(evaluated, evalChanges, definition) as AttrEvalPartial<ICanvasAttr>
  const newChanges = attrUtils.merge(changes, evalChanges, definition)

  const evalNodeChanges = attrUtils.reduceChanges<ICanvasAttr['nodes']>(newChanges.nodes || {},
    definition.entries.nodes, (k, node) => newEval.nodes && newEval.nodes[k] && expr.nodes && expr.nodes[k]
      ? attrNode.evaluate(newEval.nodes[k], expr.nodes[k], node) : undefined)

  const evalChildChanges: PartialAttr<ICanvasAttr> = { nodes: evalNodeChanges || {} }
  return attrUtils.merge(evalChanges, evalChildChanges, definition) as AttrEvalPartial<ICanvasAttr>
}

export const getVariables = (attr: AttrEvalPartial<ICanvasAttr>): attrExpr.VarLookup => {
  return {
    ...(attr.size && attr.size.width !== undefined ? { [VarSymbol.CanvasWidth]: attr.size.width / 2 } : {}),
    ...(attr.size && attr.size.height !== undefined ? { [VarSymbol.CanvasHeight]: attr.size.height / 2 } : {})
  }
}

export const removeInvalidEdges = (prevAttr: ICanvasAttr | undefined, changes: PartialAttr<ICanvasAttr>):
                                   PartialAttr<ICanvasAttr> => {
  // remove edges connecting non-existent nodes
  const prevEdges = prevAttr ? prevAttr.edges : {} as AttrLookup<IEdgeAttr>
  const newEdges = attrUtils.newLookupEntries(prevEdges, changes.edges || {}) as AttrLookup<IEdgeAttr>
  const prevNodes = prevAttr ? prevAttr.nodes : {} as AttrLookup<INodeAttr>
  const changedNodes = changes.nodes || {}

  const invalidEdges = Object.entries(prevEdges).concat(Object.entries(newEdges)).reduce((result, [k, edge]) => {
    if (changedNodes[edge.source] === null || (!prevNodes[edge.source] && !changedNodes[edge.source]))
      return {...result, [k]: null }
    else if (changedNodes[edge.target] === null || (!prevNodes[edge.target] && !changedNodes[edge.target]))
      return {...result, [k]: null }
    else return result
  }, {} as PartialAttr<ICanvasAttr['edges']>)

  return { edges: invalidEdges }
}
