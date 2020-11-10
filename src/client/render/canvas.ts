import { CanvasElement } from '../types';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { RenderElementFn } from './attribute';
import { renderDict, renderSvgDict, renderSvgAttr, renderElement } from './element';
import { D3Selection, selectOrAdd, createRenderId, isSafari } from './utils';
import { renderNode } from './node';
import * as d3 from './d3.modules';
import { NodeSpec } from '../attributes/components/node';
//import * as renderNode from '../node/render';
//import * as renderEdge from '../edge/render';
//import * as renderLabel from '../label/render';

export const selectCanvasContainer = (canvas: CanvasElement): D3Selection =>
    typeof canvas === 'string' ? d3.select(`#${canvas}`) : d3.select(canvas);

export const selectCanvas = (canvas: CanvasElement): D3Selection => {
    const container = selectCanvasContainer(canvas);
    return selectOrAdd(container, '.algorithmx', (s) =>
        s.append('svg').classed('algorithmx', true)
    );
};
export const selectCanvasInner = (sel: D3Selection): D3Selection =>
    selectOrAdd(sel, 'g', (s) => s.append('g'));

export const selectNodeGroup = (sel: D3Selection): D3Selection =>
    selectOrAdd(sel, '.nodes', (s) => s.append('g').classed('nodes', true));

export const selectEdgeGroup = (sel: D3Selection): D3Selection =>
    selectOrAdd(sel, '.edges', (s) => s.append('g').classed('edges', true));

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
    selectOrAdd(sel, '.labels', (s) => s.append('g').classed('labels', true));

export const selectNode = (sel: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    return selectOrAdd(sel, `#node-${renderId}`, (s) =>
        s.append('g').attr('id', `node-${renderId}`)
    );
};
export const selectEdge = (sel: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    return selectOrAdd(sel, `#edge-${renderId}`, (s) =>
        s.append('g').attr('id', `edge-${renderId}`)
    );
};
export const selectLabel = (sel: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    return selectOrAdd(sel, `#label-${renderId}`, (s) =>
        s.append('g').attr('id', `label-${renderId}`)
    );
};

export const getCanvasSize = (canvas: CanvasElement): [number, number] => {
    const svgBase = selectCanvasContainer(canvas);

    const size: [number, number] = [
        (svgBase.node() as Element).getBoundingClientRect().width,
        (svgBase.node() as Element).getBoundingClientRect().height,
    ];

    if (size[0] !== 0 && size[1] !== 0) return size;
    else return [100, 100];
};

const renderCanvasInner: RenderElementFn<CanvasSpec> = (selection, attrs, changes): void => {
    renderSvgAttr(selection, 'width', changes.size, (v) => v[0]);
    renderSvgAttr(selection, 'height', changes.size, (v) => v[1]);

    // add an invisible rectangle to fix zooming in Safari
    if (isSafari()) {
        selectOrAdd(selection, 'rect', (rectSel) =>
            rectSel
                .append('rect')
                .classed('safari-fix', true)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', 'none')
        );
    }

    const canvasInner = selectCanvasInner(selection);
    const labelGroup = selectLabelGroup(canvasInner);
    const edgeGroup = selectEdgeGroup(canvasInner);
    const nodeGroup = selectNodeGroup(canvasInner);

    renderDict<NodeSpec>(attrs.nodes, changes.nodes, (k) => selectNode(nodeGroup, k), renderNode);

    /*
    renderElementDict(
        (k) => canvasUtils.selectEdge(edgeGroup, k),
        getEntry(renderData, 'edges'),
        renderEdge.render
    );

    renderElementDict(
        (k) => canvasUtils.selectLabel(labelGroup, k),
        getEntry(renderData, 'labels'),
        renderLabel.render
    );
    */

    // re-render svg attributes when size changes
    /*
    const updatedRenderData = renderProcess.hasChanged(getEntry(renderData, 'size'))
        ? renderProcess.markKeysForUpdate(renderData, ['svgattr'])
        : renderData;
        */

    if (changes.svgattrs) renderSvgDict(selection, changes.svgattrs);
};

export const renderCanvas = (
    canvas: CanvasElement,
    attrs: FullAttr<CanvasSpec>,
    changes: PartialAttr<CanvasSpec>
): void => {
    renderElement(selectCanvas(canvas), attrs, changes, renderCanvasInner);
};
