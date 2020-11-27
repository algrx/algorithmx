import * as d3 from './d3.modules';
import { getAllElementChanges, renderVisRemove } from './element';
import {
    D3Selection,
    selectOrAdd,
    createRenderId,
    getColor,
    RenderAttrFn,
    renderWithAnim,
    renderSvgDict,
    renderSvgAttr,
} from './utils';
import { renderEdgeMarker, getEdgeMarkerId } from './edge-marker';
import { renderEdgeColor } from './edge-color';
import { selectInnerCanvas, selectEdge, selectEdgeGroup } from './selectors';
import { renderLabel } from './label';
import { EdgeSpec, edgeSpec } from '../attributes/components/edge';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';

export const selectEdgeLabelGroup = (edgeSel: D3Selection): D3Selection => {
    return selectOrAdd(edgeSel, '.edge-labels', (s) => s.append('g').classed('edge-labels', true));
};

const selectLabel = (edgeSel: D3Selection, id: string): D3Selection => {
    const labelGroup = selectEdgeLabelGroup(edgeSel);
    const renderId = createRenderId(id);
    return selectOrAdd(labelGroup, `#label-${renderId}`, (s) =>
        s.append('g').attr('id', `label-${renderId}`)
    );
};

const renderEdgeAttrs: RenderAttrFn<EdgeSpec> = (edgeSel, attrs, changes) => {
    const pathSel = selectOrAdd(edgeSel, '.edge-path', (s) =>
        s
            .append('path')
            .classed('edge-path', true)
            .attr('fill', 'none')
            .attr('stroke-linecap', 'round')
    );

    renderEdgeMarker(edgeSel, attrs, changes);
    if (changes.directed === true)
        pathSel.attr('marker-end', `url(#${getEdgeMarkerId(edgeSel, 'target')})`);
    if (changes.directed === false) pathSel.attr('marker-end', null);

    renderSvgAttr(pathSel, 'stroke-width', [attrs.thickness, changes.thickness]);
    renderEdgeColor([edgeSel, pathSel], attrs, changes);

    if (changes.svgattrs) renderSvgDict(pathSel, attrs.svgattrs, changes.svgattrs);
};

export const renderEdge = (
    edgeSel: D3Selection,
    attrs: FullEvalAttr<EdgeSpec> | undefined,
    initChanges: PartialEvalAttr<EdgeSpec>
) => {
    const changes = getAllElementChanges(edgeSpec, attrs, initChanges);

    renderVisRemove(edgeSel, changes.visible, changes.remove);
    if (attrs?.visible.value === true) renderEdgeAttrs(edgeSel, attrs, changes);
    else return;

    Object.entries(changes.labels ?? {}).forEach(([k, labelChanges]) => {
        renderLabel(selectLabel(edgeSel, k), attrs.labels[k], labelChanges);
    });
};
