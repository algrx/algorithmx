import * as webcola from 'webcola';
import * as d3 from '../render/d3.modules';

import { updateNodeLayout, didUpdateNodes } from './node';
import { updateEdgeLayout, didUpdateEdges } from './edge';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { Dict, mapDict } from '../utils';

export interface LayoutState {
    readonly cola: webcola.Layout;
    readonly tick: () => void;
    readonly nodes: Dict<string, webcola.Node>; // fast retrieval of node positions
    readonly adjList: Dict<string, ReadonlyArray<string>>; // fast adjacency lookup
}

export const initLayout = (tick: () => void): LayoutState => {
    //.d3adaptor(d3)
    const cola = webcola
        .d3adaptor(d3)
        .nodes([])
        .links([])
        .handleDisconnected(false)
        .avoidOverlaps(true)
        .on('tick', tick);

    return {
        cola: cola,
        tick: tick,
        nodes: {},
        adjList: {},
    };
};

export const resetLayout = (layoutState: LayoutState): LayoutState => {
    // clear previous cola
    layoutState.cola
        .links([])
        .nodes([])
        .stop()
        .on('tick', () => null);

    return initLayout(layoutState.tick);
};

export const createAdjList = (
    attrs: FullEvalAttr<CanvasSpec>
): Dict<string, ReadonlyArray<string>> => {
    const matrix: Dict<string, ReadonlyArray<string>> = mapDict(attrs.nodes, (n) => []);

    Object.values(attrs.edges).forEach((edge) => {
        if (!(edge.source in matrix) || !(edge.target in matrix)) return;

        (matrix[edge.source] as Array<string>).push(edge.target);
        (matrix[edge.target] as Array<string>).push(edge.source);
    });

    return matrix;
};

export const didUpdateLayout = (changes: PartialEvalAttr<CanvasSpec>): boolean => {
    const didUpdateCanvas =
        changes.size !== undefined ||
        changes.edgelayout !== undefined ||
        changes.edgelength !== undefined;
    return (
        didUpdateCanvas ||
        didUpdateNodes(changes.nodes ?? {}) ||
        didUpdateEdges(changes.edges ?? {})
    );
};

export const updateCanvasLayout = (
    layoutState: LayoutState,
    attrs: FullEvalAttr<CanvasSpec>,
    changes: PartialEvalAttr<CanvasSpec>
): LayoutState => {
    // canvas size
    if (changes.size && changes.size.value) {
        layoutState.cola.size([changes.size.value[0], changes.size.value[1]]);
    }

    // edge lengths
    if (changes.edgelayout || changes.edgelength !== undefined) {
        if (attrs.edgelayout === 'individual')
            layoutState.cola.linkDistance((edge) => edge.length!);
        else if (attrs.edgelayout === 'jaccard')
            layoutState.cola.jaccardLinkLengths(attrs.edgelength, 1);
        else if (attrs.edgelayout === 'symmetric')
            layoutState.cola.symmetricDiffLinkLengths(attrs.edgelength, 0.1);
    }

    // nodes and edges
    const stateWithNodes = changes.nodes
        ? updateNodeLayout(layoutState, attrs.nodes, changes.nodes)
        : layoutState;
    const newState = updateEdgeLayout(stateWithNodes, attrs, changes);

    if (didUpdateLayout(changes)) {
        // start the layout process
        newState.cola.start();
        return { ...newState, adjList: createAdjList(attrs) };
    }

    return newState;
};
