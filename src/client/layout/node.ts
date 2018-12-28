import { INodeAttr, Shape } from '../attributes/definitions/node'
import { Lookup } from '../utils'
import { AttrEval, AttrEvalPartial, AttrLookup } from '../attributes/types'
import { ICanvasAttr } from '../attributes/definitions/canvas'
import * as utils from '../utils'
import * as webcola from 'webcola'

const fromAttrChanges = (attr: AttrEval<INodeAttr>, changes: AttrEvalPartial<INodeAttr>): Partial<webcola.Node> => {
  const height = attr.shape === 'circle' ? attr.size.width * 2 : attr.size.height * 2
  const changedHeight = changes.size && (
    attr.shape === 'circle' ? changes.size.width !== undefined
    : changes.size.height !== undefined)

  return {
    ...(changes.size && changes.size.width !== undefined ? { width: attr.size.width * 2 } : {}),
    ...(changedHeight ? { height: height } : {}),
    ...(changes.pos && changes.pos.x !== undefined ? { x: attr.pos.x } : {}),
    ...(changes.pos && changes.pos.y !== undefined ? { y: attr.pos.y } : {}),
    ...(changes.fixed !== undefined ? { fixed: attr.fixed ? 1 : 0 } : {})
  }
}

export const didUpdateLayout = (attr: AttrEval<INodeAttr>, changes: AttrEvalPartial<INodeAttr>): boolean => {
  return !utils.isDictEmpty(fromAttrChanges(attr, changes))
}

export const mergeLookup = (nodes: Lookup<webcola.Node>, attr: AttrEval<AttrLookup<INodeAttr>>,
                            changes: AttrEvalPartial<AttrLookup<INodeAttr>>): Lookup<webcola.Node> => {
  // merge changes with previous nodes so as to preserve positions and references
  const nodeChanges: Lookup<Partial<webcola.Node> | null> = utils.mapDict(changes, (k, v) =>
    v === null ? null : fromAttrChanges(attr[k], v))

  return Object.keys(nodes).concat(Object.keys(changes)).reduce((result, k) =>
    nodeChanges[k] === null ? result // remove node
    : nodes[k] === undefined ? {...result, [k]: nodeChanges[k] as webcola.Node } // add node
    : nodeChanges[k] === undefined ? {...result, [k]: nodes[k] } // unchanged
    : {...result, [k]: {...nodes[k], ...nodeChanges[k] } } // changed
  , {} as Lookup<webcola.Node>)
}

export const updateCola = (cola: webcola.Layout, nodes: Lookup<webcola.Node>): void => {
  // cola doesn't work when you call .nodes() with a new array
  cola.nodes().splice(0, cola.nodes().length, ...Object.values(nodes))
}
