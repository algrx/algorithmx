import { Lookup } from '../utils';
import { AttrEval, AttrEvalPartial } from '../attributes/types';
import { ICanvasAttr } from '../attributes/definitions/canvas';
import * as utils from '../utils';
import * as webcola from 'webcola';

export const didUpdateLayout = (changes: AttrEvalPartial<ICanvasAttr>): boolean => {
    return changes.size !== undefined || changes.edgelengths !== undefined;
};

export const updateCola = (cola: webcola.Layout, attr: AttrEval<ICanvasAttr>): void => {
    cola.size([attr.size.width, attr.size.height]);

    if (attr.edgelengths.type === 'individual') cola.linkDistance((edge) => edge.length);
    else if (attr.edgelengths.type === 'jaccard')
        cola.jaccardLinkLengths(attr.edgelengths.length, 1);
    else if (attr.edgelengths.type === 'symmetric')
        cola.symmetricDiffLinkLengths(attr.edgelengths.length, 0.1);
};

export const calcAdjacency = (
    nodes: AttrEval<ICanvasAttr['nodes']>,
    edges: AttrEval<ICanvasAttr['edges']>
): Lookup<ReadonlyArray<string>> => {
    const initMatrix: Lookup<ReadonlyArray<string>> = utils.mapDict(nodes, (n) => []);

    return Object.values(edges).reduce((matrix: Lookup<ReadonlyArray<string>>, edge) => {
        const withSource = { ...matrix, [edge.target]: matrix[edge.target].concat([edge.source]) };
        const withTarget = {
            ...withSource,
            [edge.source]: withSource[edge.source].concat([edge.target]),
        };
        return withTarget;
    }, initMatrix);
};
