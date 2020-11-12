import * as webcola from 'webcola';

import { LayoutState } from './canvas';
import { DictSpec } from '../attributes/spec';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { NodeSpec } from '../attributes/components/node';
import { Dict, mapDict } from '../utils';

export const didUpdateNodes = (changes: PartialEvalAttr<DictSpec<NodeSpec>>): boolean => {
    return Object.values(changes).some(
        (n) =>
            n.size !== undefined ||
            n.pos !== undefined ||
            n.fixed !== undefined ||
            n.remove === true
    );
};

export const updateNodeLayout = (
    layoutState: LayoutState,
    attrs: FullEvalAttr<DictSpec<NodeSpec>>,
    changes: PartialEvalAttr<DictSpec<NodeSpec>>
): LayoutState => {
    // check for updates
    if (!didUpdateNodes(changes)) return layoutState;

    // create a node layout diff
    const layoutNodesDiff = mapDict(attrs, (n, k) => {
        const nodeChanges = changes[k] ?? {};
        const nodeDiff: Partial<webcola.Node> = {
            ...(nodeChanges.size ? { width: n.size.value[0], height: n.size.value[1] } : {}),
            ...(nodeChanges.pos ? { x: n.pos.value[0], y: n.pos.value[1] } : {}),
            ...(nodeChanges.fixed ? { fixed: n.fixed ? 1 : 0 } : {}),
        };
        return nodeDiff;
    });

    // merge diff with previous layout to preserve node positions and references
    const layoutNodes = mapDict(layoutNodesDiff, (nodeDiff, k) =>
        !(k in layoutState.nodes)
            ? (nodeDiff as webcola.Node)
            : { ...layoutState.nodes[k], ...nodeDiff }
    );

    // cola doesn't work when you call .nodes() with a new array
    const layoutNodeArray = layoutState.cola.nodes();
    layoutNodeArray.splice(0, layoutNodeArray.length, ...Object.values(layoutNodes));
    return {
        ...layoutState,
        nodes: layoutNodes,
    };
};
