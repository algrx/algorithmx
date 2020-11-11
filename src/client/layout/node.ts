import * as webcola from 'webcola';

import { DictSpec } from '../attributes/spec';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { NodeSpec } from '../attributes/components/node';
import { Dict, mapDict } from '../utils';
import { LayoutState } from './canvas';

export const didUpdateNodes = (changes: PartialAttr<DictSpec<NodeSpec>>): boolean => {
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
    attrs: FullAttr<DictSpec<NodeSpec>>,
    changes: PartialAttr<DictSpec<NodeSpec>>
): LayoutState => {
    // check for updates
    if (!didUpdateNodes(changes)) return layoutState;

    // create a node layout diff
    const layoutNodesDiff = mapDict(attrs, (n, k) => {
        const nodeChanges = changes[k] ?? {};
        return {
            ...(nodeChanges.size
                ? { width: n.size.value[0] as number, height: n.size.value[1] as number }
                : {}),
            ...(nodeChanges.pos
                ? { width: n.pos.value[0] as number, height: n.pos.value[1] as number }
                : {}),
            ...(nodeChanges.fixed ? { fixed: n.fixed ? 1 : 0 } : {}),
        };
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
