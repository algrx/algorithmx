import { Lookup } from '../utils'
import { IEdgeAttr } from '../attributes/definitions/edge'
import { AttrEval, AttrEvalPartial, AttrLookup } from '../attributes/types'
import * as webcola from 'webcola'
import * as utils from '../utils'

const fromAttr = (attr: AttrEval<IEdgeAttr>): webcola.Link<string> => {
  return {
    source: attr.source,
    target: attr.target,
    length: attr.length
  }
}

export const didUpdateLayout = (changes: AttrEvalPartial<IEdgeAttr>): boolean => {
  return changes.source !== undefined || changes.target !== undefined || changes.length !== undefined
}

export const createLookup = (attr: AttrEval<AttrLookup<IEdgeAttr>>): Lookup<webcola.Link<string>> => {
  return utils.mapDict(attr, (k, v) => fromAttr(v))
}

export const updateCola = (cola: webcola.Layout, nodes: Lookup<webcola.Node>,
                           edges: Lookup<webcola.Link<string>>): void => {
  // cola doesn't work when you call .nodes() with a new array
  const newEdges = utils.mapDict(edges, (k, edge) => ({...edge,
    source: nodes[edge.source],
    target: nodes[edge.target]
  }))
  cola.links().splice(0, cola.links().length, ...Object.values(newEdges))
}
