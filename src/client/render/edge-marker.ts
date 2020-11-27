import * as d3 from './d3.modules';
import { EdgeSpec } from '../attributes/components/edge';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { D3Selection, RenderAttrFn, selectOrAdd, getColor } from './utils';

export const MARKER_SIZE = 10;

const ARROW_MARKER = <const>{
    path: 'M 0,0 m -5,-5 L 5,0 L -5,5 Z',
    viewBox: '-5 -5 10 10',
    size: MARKER_SIZE,
};

export const getEdgeMarkerId = (edgeSel: D3Selection, markerType: string): string => {
    const markerSel = edgeSel.select('defs').select(`.marker-${markerType}`);
    if (!markerSel.empty()) {
        return markerSel.attr('id');
    } else {
        const randomId = Math.random().toString(36).substr(2, 9);
        return `marker-${randomId}`;
    }
};

export const selectEdgeMarker = (edgeSel: D3Selection, markerId: string): D3Selection => {
    const defsSel = selectOrAdd(edgeSel, 'defs', (s) => s.insert('svg:defs', ':first-child'));
    const renderId = getEdgeMarkerId(edgeSel, markerId);
    return selectOrAdd(defsSel, `#${renderId}`, (s) => {
        const marker = s
            .append('svg:marker')
            .attr('id', renderId)
            .classed(`marker-${markerId}`, true);
        marker.append('path');
        return marker;
    });
};

export const renderEdgeMarker: RenderAttrFn<EdgeSpec> = (edgeSel, attrs, changes) => {
    if (changes.directed === true) {
        const marketTarget = selectEdgeMarker(edgeSel, 'target');
        const markerShape = ARROW_MARKER;
        marketTarget
            .attr('viewBox', markerShape.viewBox)
            .attr('markerWidth', markerShape.size)
            .attr('markerHeight', markerShape.size)
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('orient', 'auto')
            .attr('refX', 0)
            .attr('refY', 0);
        marketTarget
            .select('path')
            .attr('d', markerShape.path)
            .attr('fill', getColor(attrs.color.value));
    } else if (changes.directed === false) {
        edgeSel.select('defs').remove();
    }
};
