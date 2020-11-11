import * as d3 from './d3.modules';
import { NodeSpec, nodeSpec, NodeShape, radiusAtAngle } from '../attributes/components/node';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { renderDict, renderSvgDict, renderSvgAttr, renderElement } from './common';
import { D3Selection, selectOrAdd, createRenderId, isSafari, parseColor } from './utils';
import { LayoutState } from '../layout/canvas';
import { selectNodeGroup, selectNode } from './selectors';

interface LiveNodeAttrs {
    readonly pos: [number, number];
    readonly size: [number, number];
}

export const getLiveNodeAttrs = (
    canvasSel: D3Selection,
    layoutState: LayoutState,
    canvasAttrs: FullAttr<CanvasSpec>,
    nodeId: string
): LiveNodeAttrs => {
    const nodeGroup = selectNodeGroup(canvasSel);

    const nodeAttrs = canvasAttrs.nodes[nodeId];
    const nodeLayout = layoutState.nodes[nodeId];

    const livePos: [number, number] = [nodeLayout.x, nodeLayout.y!];

    if (nodeAttrs.visible) {
        const nodeSel = selectNode(nodeGroup, nodeId);
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
    attrs: FullAttr<NodeSpec>,
    liveAttrs: LiveNodeAttrs,
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
