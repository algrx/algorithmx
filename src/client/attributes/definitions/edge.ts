import { PartialAttr, AttrLookup, AttrString, AttrNum, AttrArray, AttrBool } from '../types'
import { AnimationFull } from './animation'
import { IElementAttr, ISvgCssAttr } from './element'
import { ILabelAttr } from './label'
import { AttrType } from '../definitions'
import { COLORS } from '../../render/utils'
import * as attrLabel from './label'
import * as attrElement from './element'
import * as attrDef from '../definitions'
import * as attrUtils from '../utils'
import * as math from '../../math'
import * as utils from '../../utils'


export interface IEdgeAttr extends IElementAttr, ISvgCssAttr {
  readonly labels: AttrLookup<ILabelAttr>
  readonly source: AttrString
  readonly target: AttrString
  readonly directed: AttrBool
  readonly length: AttrNum
  readonly thickness: AttrNum
  readonly color: AttrString
  readonly flip: AttrBool
  readonly curve: AttrString & Curve
  readonly path: AttrArray<{ readonly x: AttrNum, readonly y: AttrNum }>
}

export enum EnumCurve {
  basis = 'basis',
  bundle = 'bundle',
  cardinal = 'cardinal',
  'catmull-rom' = 'catmull-rom',
  linear = 'linear',
  'monotone-x' = 'monotone-x',
  'monotone-y' = 'monotone-y',
  natural = 'natural',
  step = 'step', 'step-before' = 'step-before', 'step-after' = 'step-after'
}
export type Curve = keyof typeof EnumCurve

export const definition = attrDef.extendRecordDef<IEdgeAttr, IElementAttr>({
  entries: {
    labels: { type: AttrType.Lookup, entry: attrLabel.definition },
    source: { type: AttrType.String },
    target: { type: AttrType.String },
    directed: { type: AttrType.Boolean },
    length: { type: AttrType.Number },
    thickness: { type: AttrType.Number },
    color: { type: AttrType.String },
    flip: { type: AttrType.Boolean },
    curve: { type: AttrType.String, validValues: utils.enumValues(EnumCurve) },
    path: { type: AttrType.Array, entry: {
      type: AttrType.Record, entries: {
        x: { type: AttrType.Number },
        y: { type: AttrType.Number }
      }, keyOrder: ['x', 'y'] }
    },
    ...attrElement.svgCssDefEntries
  },
  type: AttrType.Record,
  keyOrder: ['labels', 'source', 'target', 'directed', 'length', 'thickness', 'color', 'flip', 'curve', 'path',
    ...attrElement.svgCssDefKeys],
  validVars: []
}, attrElement.definition)

export const defaults: IEdgeAttr = {
  ...attrElement.defaults,
  labels: {} as AttrLookup<ILabelAttr>,
  source: '',
  target: '',
  directed: false,
  length: 70,
  thickness: 2.5,
  color: COLORS.silver,
  flip: true,
  curve: 'natural',
  path: [],
  ...attrElement.svgCssDefaults
}

const labelDefaults: PartialAttr<ILabelAttr> = {
  align: 'radial',
  rotate: true,
  size: 11,
  radius: 3
}

export const animationDefaults: PartialAttr<AnimationFull<IEdgeAttr>> = {
  ...attrElement.animationDefaults,
  labels: { '*': attrLabel.animationDefaults },
  color: {
    duration: 0.6,
    linger: 0
  }
}

export const init = (): IEdgeAttr => {
  return defaults
}

export const initChildren = (prevAttr: IEdgeAttr, changes: PartialAttr<IEdgeAttr>): PartialAttr<IEdgeAttr> => {
  const newLabels = utils.mapDict(attrUtils.newLookupEntries(prevAttr.labels, changes.labels),
    (k, v, i): PartialAttr<ILabelAttr> => {

    const path = changes.path ? changes.path : prevAttr.path
    const pathMidY = path.length === 0 ? 0 : path[Math.floor((path.length - 1) / 2)].y
    const pathMidYNum = typeof pathMidY === 'number' ? pathMidY : 0

    const index = Object.keys(prevAttr.labels).length + i
    const angle = (index % 2) === 0 ? Math.PI / 2 : Math.PI * 3 / 2

    return {...attrLabel.init(k as string), ...labelDefaults,
      pos: { x: 0, y: pathMidYNum },
      angle: math.angleToDeg(angle)
    }
  })

  return {
    labels: newLabels
  }
}

interface EdgeAdjMatrix { readonly [k: string]: { readonly [k: string]: number } }
const incrementMatrix = (matrix: EdgeAdjMatrix, source: string, target: string): EdgeAdjMatrix => {
  const sourceAdj = matrix[source] === undefined ? {} : matrix[source]
  const targetAdj = matrix[target] === undefined ? {} : matrix[target]

  const sourceLookup = {...sourceAdj, [target]: sourceAdj[target] === undefined ? 1 : sourceAdj[target] + 1 }
  const targetLookup = {...targetAdj, [source]: targetAdj[source] === undefined ? 1 : targetAdj[source] + 1 }

  return {...matrix, [source]: sourceLookup, [target]: targetLookup }
}

const createAdjMatrix = (edges: AttrLookup<IEdgeAttr>): EdgeAdjMatrix => {
  return Object.values(edges).reduce((matrix, e) => {
    return incrementMatrix(matrix, e.source, e.target)
  }, {} as EdgeAdjMatrix)
}

export const initLookup = (prevEdges: AttrLookup<IEdgeAttr>, changes: PartialAttr<AttrLookup<IEdgeAttr>>):
                           PartialAttr<AttrLookup<IEdgeAttr>> => {
  const newEdges = attrUtils.newLookupEntries(prevEdges, changes)
  if (utils.isDictEmpty(newEdges)) return newEdges

  const edgeInitData = Object.entries(newEdges).reduce((result, [k, edge]) => {
    // edges are expected to be provided with source and target attributes initially
    const source = edge.source || ''
    const target = edge.target || ''

    const newMatrix = incrementMatrix(result.matrix, source, target)
    const i = newMatrix[source][target] - 1

    const path: IEdgeAttr['path'] =
      source !== target ? [{
        x: 0, y: Math.pow(-1, i + 1) * Math.ceil(i / 2) * 16
      }]
      : [{ x: -10 - i * 10, y: (i * 10) / 2 },
         { x: 0, y: i * 10 },
         { x: 10 + i * 10, y: (i * 10) / 2 }]

    const edgeDefaults = {...init(), path: path }
    const initEdgeChildren = initChildren(edgeDefaults, edge)
    const initEdge = attrUtils.merge(edgeDefaults, initEdgeChildren, definition)

    return { matrix: newMatrix, edges: {...result.edges, [k]: initEdge } }
  }, { matrix: createAdjMatrix(prevEdges), edges: {} as AttrLookup<IEdgeAttr> })

  return edgeInitData.edges
}
