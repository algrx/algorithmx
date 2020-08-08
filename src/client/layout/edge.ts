import { Lookup } from '../utils';
import { IEdgeAttr } from '../attributes/definitions/edge';
import { AttrEval, AttrEvalPartial, AttrLookup } from '../attributes/types';
import { NodeLayout } from './node';
import * as webcola from 'webcola';
import * as utils from '../utils';

export type EdgeLayout = webcola.Link<string>;

const fromAttr = (attr: AttrEval<IEdgeAttr>): EdgeLayout => {
    return {
        source: attr.source,
        target: attr.target,
        length: attr.length,
    };
};

export const didUpdateLayout = (changes: AttrEvalPartial<IEdgeAttr>): boolean => {
    return (
        changes.source !== undefined || changes.target !== undefined || changes.length !== undefined
    );
};

export const createLookup = (attr: AttrEval<AttrLookup<IEdgeAttr>>): Lookup<EdgeLayout> => {
    return utils.mapDict(attr, (k, v) => fromAttr(v));
};

export const updateCola = (
    cola: webcola.Layout,
    nodes: Lookup<NodeLayout>,
    edges: Lookup<EdgeLayout>
): void => {
    // cola doesn't work when you call .nodes() with a new array
    const newEdges = utils.mapDict(edges, (k, edge) => ({
        ...edge,
        source: nodes[edge.source],
        target: nodes[edge.target],
    }));
    cola.links().splice(0, cola.links().length, ...Object.values(newEdges));
};
