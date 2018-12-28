import { PartialAttr, AttrLookup, AttrString, AttrNum, AttrArray } from '../types'
import { AnimationFull } from './animation'
import { ICommonAttr } from './common'
import { ILabelAttr } from './label'
import { AttrType } from '../definitions'
import * as attrLabel from './label'
import * as attrCommon from './common'
import * as attrDef from '../definitions'
import * as attrUtils from '../utils'
import * as math from '../../math'
import * as utils from '../../utils'

export interface IEdgeAttr extends ICommonAttr {
  readonly labels: AttrLookup<ILabelAttr>
  readonly source: AttrString
  readonly target: AttrString
  readonly length: AttrNum
  readonly width: AttrNum
  readonly color: AttrString
  readonly curve: AttrString & Curve
  readonly path: AttrArray<{ readonly x: AttrNum, readonly y: AttrNum }>
}

export enum Curve {
  Linear = 'linear',
  Rect = 'rect',
  Ellipse = 'ellipse'
}

export const definition = attrDef.extendRecordDef<IEdgeAttr, ICommonAttr>({
  entries: {
    labels: { type: AttrType.Lookup, entry: attrLabel.definition },
    source: { type: AttrType.String },
    target: { type: AttrType.String },
    length: { type: AttrType.Number },
    width: { type: AttrType.Number },
    color: { type: AttrType.String },
    curve: { type: AttrType.String, validValues: utils.enumValues(Curve) },
    path: { type: AttrType.Array, entry: {
      type: AttrType.Record, entries: {
        x: { type: AttrType.Number },
        y: { type: AttrType.Number }
      }, keyOrder: ['x', 'y'] }
    }
  },
  type: AttrType.Record,
  keyOrder: ['labels', 'source', 'target', 'length', 'width', 'color', 'curve', 'path'],
  validVars: []
}, attrCommon.definition)

export const defaults: IEdgeAttr = {
  ...attrCommon.defaults,
  labels: {} as AttrLookup<ILabelAttr>,
  source: '',
  target: '',
  length: 70,
  width: 2,
  color: 'rgb(150,150,150)',
  curve: Curve.Linear,
  path: []
}

const labelDefaults: PartialAttr<ILabelAttr> = {
  align: 'radial',
  rotate: true,
  radius: 3
}

export const animationDefaults: PartialAttr<AnimationFull<IEdgeAttr>> = {
  ...attrCommon.animationDefaults,
  labels: { '*': attrLabel.animationDefaults }
}

export const init = (): IEdgeAttr => {
  return defaults
}

export const initChildren = (prevAttr: IEdgeAttr, changes: PartialAttr<IEdgeAttr>): PartialAttr<IEdgeAttr> => {
  const newLabels = utils.mapDict(attrUtils.newLookupEntries(prevAttr.labels, changes.labels),
    (k, v, i): PartialAttr<ILabelAttr> => {

    const path = changes.path ? changes.path : prevAttr.path
    const pathMidY = path.length === 0 ? 0 : path[(path.length - 1) / 2].y
    const pathMidYNum = typeof pathMidY === 'number' ? pathMidY : 0

    const index = Object.keys(prevAttr.labels).length + i
    const angle = index === 0 ? Math.PI / 2 : index === 1 ? Math.PI * 3 / 2
      : Math.PI * 3 / 4 + (Math.PI / 2) * ((index - 2) % 4)

    const radius = index < 2 ? 3 : 6

    return {...attrLabel.init(k as string), ...labelDefaults,
      pos: { x: 0, y: pathMidYNum },
      angle: math.angleToDeg(angle),
      radius: radius
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

export const getLookupDefaults = (prevEdges: AttrLookup<IEdgeAttr>, changes: PartialAttr<AttrLookup<IEdgeAttr>>):
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
      source !== target ? [{ x: 0, y: i === 0 ? 0 : Math.pow(-1, i + 1) * 20 }]
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
