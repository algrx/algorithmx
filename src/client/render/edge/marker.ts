import { IEdgeAttr } from '../../attributes/definitions/edge';
import { D3Selection } from '../utils';
import { RenderAttr, getEntry } from '../process';
import * as renderFns from '../render';
import * as renderUtils from '../utils';
import * as utils from '../../utils';

export const MARKER_SIZE = 10;

interface RenderMarker {
    readonly path: string;
    readonly viewBox: string;
    readonly size: number;
}
const MARKER_ARROW: RenderMarker = {
    path: 'M 0,0 m -5,-5 L 5,0 L -5,5 Z',
    viewBox: '-5 -5 10 10',
    size: MARKER_SIZE,
};

export const getFullId = (edgeSel: D3Selection, markerId: string): string => {
    const markerSel = edgeSel.select('defs').select(`.marker-${markerId}`);
    if (!markerSel.empty()) {
        return markerSel.attr('id');
    } else {
        return `marker-${utils.randomId()}`;
    }
};

export const select = (edgeSel: D3Selection, markerId: string): D3Selection => {
    const defsSel = renderUtils.selectOrAdd(edgeSel, 'defs', (s) =>
        s.insert('svg:defs', ':first-child')
    );
    const fullId = getFullId(edgeSel, markerId);
    return renderUtils.selectOrAdd(defsSel, `#${fullId}`, (s) => {
        const marker = s
            .append('svg:marker')
            .attr('id', fullId)
            .classed(`marker-${markerId}`, true);
        marker.append('path');
        return marker;
    });
};

export const render = (selection: D3Selection, renderData: RenderAttr<IEdgeAttr>): void => {
    renderFns.render(selection, getEntry(renderData, 'directed'), (sel, directed) => {
        if (directed) {
            const marketTarget = select(selection, 'target');
            const shape = MARKER_ARROW;
            marketTarget
                .attr('viewBox', shape.viewBox)
                .attr('markerWidth', shape.size)
                .attr('markerHeight', shape.size)
                .attr('markerUnits', 'userSpaceOnUse')
                .attr('orient', 'auto')
                .attr('refX', 0)
                .attr('refY', 0);
            marketTarget
                .select('path')
                .attr('d', shape.path)
                .attr('fill', renderUtils.parseColor(renderData.attr.color));
            return sel;
        } else {
            selection.select('defs').remove();
            return sel;
        }
    });
};
