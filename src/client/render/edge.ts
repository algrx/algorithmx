import * as d3 from './d3.modules';
import { EdgeSpec } from '../attributes/components/edge';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import {
    RenderElementFn,
    renderAnimAttr,
    renderDict,
    renderSvgDict,
    renderSvgAttr,
    renderElement,
} from './common';
import { D3Selection, selectOrAdd, createRenderId, parseColor } from './utils';
import { renderEdgeMarker, getEdgeMarkerId } from './edge-marker';
import { renderEdgeColor } from './edge-color';
import { selectInnerCanvas, selectEdge, selectEdgeGroup } from './selectors';

export const selectEdgeLabelGroup = (edgeSel: D3Selection): D3Selection => {
    return selectOrAdd(edgeSel, '.edge-labels', (s) => s.append('g').classed('edge-labels', true));
};

const selectLabel = (edgeSel: D3Selection, id: string): D3Selection => {
    const labelGroup = selectEdgeLabelGroup(edgeSel);
    const renderId = createRenderId(id);
    return selectOrAdd(edgeSel, `#label-${renderId}`, (s) =>
        s.append('g').attr('id', `label-${renderId}`)
    );
};

const renderEdgeAttrs: RenderElementFn<EdgeSpec> = (edgeSel, attrs, changes) => {
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

    renderSvgAttr(pathSel, 'stroke-width', changes.thickness);
    renderEdgeColor([edgeSel, pathSel], attrs, changes);

    if (changes.svgattrs) renderSvgDict(pathSel, changes.svgattrs);
};

export const renderEdge = (
    edgeSel: D3Selection,
    attrs: FullEvalAttr<EdgeSpec> | undefined,
    changes: PartialEvalAttr<EdgeSpec>
) => {
    renderElement(edgeSel, attrs, changes, renderEdgeAttrs);

    if (!attrs || attrs.visible.value === false) return;

    Object.entries(changes.labels ?? {}).forEach(([k, labelChanges]) => {
        const labelSel = selectLabel(edgeSel, k);

        //renderElement(labelSel, attrs.labels[k], changes, renderLabelAttrs);
    });
};
