import { D3Selection } from '../utils';
import { Canvas } from '../../types/events';
import * as renderUtils from '../utils';
import * as d3 from '../d3.modules';

export const selectCanvasContainer = (canvas: Canvas): D3Selection =>
    typeof canvas === 'string' ? d3.select(`#${canvas}`) : d3.select(canvas);

export const selectCanvas = (canvas: Canvas): D3Selection => {
    const container = selectCanvasContainer(canvas);
    return renderUtils.selectOrAdd(container, '.algorithmx', (s) =>
        s.append('svg').classed('algorithmx', true)
    );
};
export const selectCanvasInner = (sel: D3Selection): D3Selection =>
    renderUtils.selectOrAdd(sel, 'g', (s) => s.append('g'));

export const selectSafariFix = (sel: D3Selection): D3Selection =>
    renderUtils.selectOrAdd(sel, 'rect', (s) =>
        s
            .append('rect')
            .classed('safari-fix', true)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'none')
    );

export const selectNodeGroup = (sel: D3Selection): D3Selection =>
    renderUtils.selectOrAdd(sel, '.nodes', (s) => s.append('g').classed('nodes', true));

export const selectEdgeGroup = (sel: D3Selection): D3Selection =>
    renderUtils.selectOrAdd(sel, '.edges', (s) => s.append('g').classed('edges', true));

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
    renderUtils.selectOrAdd(sel, '.labels', (s) => s.append('g').classed('labels', true));

export const selectNode = (sel: D3Selection, id: string): D3Selection => {
    const renderId = renderUtils.renderId(id);
    return renderUtils.selectOrAdd(sel, `#node-${renderId}`, (s) =>
        s.append('g').attr('id', `node-${renderId}`)
    );
};
export const selectEdge = (sel: D3Selection, id: string): D3Selection => {
    const renderId = renderUtils.renderId(id);
    return renderUtils.selectOrAdd(sel, `#edge-${renderId}`, (s) =>
        s.append('g').attr('id', `edge-${renderId}`)
    );
};
export const selectLabel = (sel: D3Selection, id: string): D3Selection => {
    const renderId = renderUtils.renderId(id);
    return renderUtils.selectOrAdd(sel, `#label-${renderId}`, (s) =>
        s.append('g').attr('id', `label-${renderId}`)
    );
};

export const getCanvasSize = (canvas: Canvas): [number, number] => {
    const svgBase = selectCanvasContainer(canvas);

    const size: [number, number] = [
        (svgBase.node() as Element).getBoundingClientRect().width,
        (svgBase.node() as Element).getBoundingClientRect().height,
    ];

    if (size[0] !== 0 && size[1] !== 0) return size;
    else return [100, 100];
};
