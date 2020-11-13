import * as d3 from './d3.modules';
import { Node as NodeLayout } from 'webcola';
import { renderDict, renderSvgDict, renderSvgAttr, renderElement } from './common';
import { selectNodeGroup, selectNode } from './selectors';
import { D3Selection, selectOrAdd, createRenderId, isSafari, parseColor } from './utils';
import { NodeSpec, radiusAtAngle } from '../attributes/components/node';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { LayoutState } from '../layout/canvas';

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
