import * as d3 from './d3.modules';
import { Node as NodeLayout } from 'webcola';
import { selectNodeGroup, selectNode } from './selectors';
import { D3Selection, selectOrAdd, createRenderId, isSafari, getColor } from './utils';
import { NodeSpec, radiusAtAngle } from '../attributes/components/node';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { LayoutState } from '../layout/canvas';
import { Dict } from '../utils';

export interface LiveNodeAttrs {
    readonly pos: [number, number];
    readonly size: [number, number];
}

export const getLiveNodeAttrs = (
    nodeSel: D3Selection,
    nodeLayout: NodeLayout,
    attrs: FullEvalAttr<NodeSpec>
): LiveNodeAttrs => {
    const livePos: [number, number] = [nodeLayout.x, nodeLayout.y!];

    if (attrs.visible) {
        const liveWidth = nodeSel.attr('_width');
        const liveHeight = nodeSel.attr('_height');

        return {
            size:
                liveWidth !== null && liveHeight !== null
                    ? [parseFloat(liveWidth), parseFloat(liveHeight)]
                    : [nodeLayout.width! / 2, nodeLayout.height! / 2],
            pos: livePos,
        };
    } else {
        return {
            size: [nodeLayout.width! / 2, nodeLayout.height! / 2],
            pos: livePos,
        };
    }
};

export const getPointAtNodeBoundary = (
    [attrs, liveAttrs]: [FullEvalAttr<NodeSpec>, LiveNodeAttrs],
    angle: number,
    offset: number = 0
): [number, number] => {
    const fullOffset =
        radiusAtAngle(angle, liveAttrs.size[0], liveAttrs.size[1], attrs.shape) + offset;
    return [
        liveAttrs.pos[0] + fullOffset * Math.cos(angle),
        liveAttrs.pos[1] + fullOffset * Math.sin(angle),
    ];
};

export const renderLiveNodes = (
    canvasSel: D3Selection,
    canvasAttrs: FullEvalAttr<CanvasSpec>,
    liveNodes: Dict<string, LiveNodeAttrs>
) => {
    Object.entries(liveNodes).forEach(([k, liveNode]) => {
        if (!canvasAttrs.nodes[k].visible) return;
        const nodeSel = selectNode(canvasSel, k);

        const curTransform = nodeSel.attr('transform') ?? '';
        const splitIndex = curTransform.indexOf(')');
        const translate = `translate(${liveNode.pos[0]},${-liveNode.pos[1]})`;

        if (splitIndex >= 0)
            nodeSel.attr('transform', translate + curTransform.substring(splitIndex + 1));
        else nodeSel.attr('transform', translate);
    });
};
