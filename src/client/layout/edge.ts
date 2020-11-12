import * as webcola from 'webcola';

import { LayoutState } from './canvas';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { EdgeSpec } from '../attributes/components/edge';
import { DictSpec } from '../attributes/spec';
import { Dict, mapDict } from '../utils';

export const didUpdateEdges = (changes: PartialEvalAttr<DictSpec<EdgeSpec>>): boolean => {
    return Object.values(changes).some(
        (e) =>
            e.source !== undefined ||
            e.target !== undefined ||
            e.length !== undefined ||
            e.remove === true
    );
};

export const updateEdgeLayout = (
    layoutState: LayoutState,
    attrs: FullEvalAttr<CanvasSpec>,
    changes: PartialEvalAttr<CanvasSpec>
): LayoutState => {
    // check for updates
    if (
        !didUpdateEdges(changes.edges ?? {}) &&
        !changes.edgelayout &&
        !(changes.edgelength === undefined)
    )
        return layoutState;

    // re-add all edges
    const layoutEdges = Object.values(attrs.edges)
        .filter((e) => e.source in layoutState.nodes && e.target in layoutState.nodes)
        .map((e) => ({
            source: layoutState.nodes[e.source],
            target: layoutState.nodes[e.target],
            length: e.length,
        }));

    // cola doesn't work when you call .links() with a new array
    const layoutEdgeArray = layoutState.cola.links();
    layoutEdgeArray.splice(0, layoutEdgeArray.length, ...layoutEdges);
    return layoutState;
};
