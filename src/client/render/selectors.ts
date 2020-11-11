import { CanvasElement } from '../types';
import { D3Selection, selectOrAdd, createRenderId } from './utils';
import * as d3 from './d3.modules';

export const selectCanvasContainer = (canvasEl: CanvasElement): D3Selection =>
    typeof canvasEl === 'string' ? d3.select(`#${canvasEl}`) : d3.select(canvasEl);

export const selectCanvas = (canvasEl: CanvasElement): D3Selection => {
    const container = selectCanvasContainer(canvasEl);
    return selectOrAdd(container, '.algorithmx', (s) =>
        s.append('svg').classed('algorithmx', true)
    );
};

export const selectInnerCanvas = (canvasSel: D3Selection): D3Selection =>
    selectOrAdd(canvasSel, 'g', (s) => s.append('g'));

export const selectNodeGroup = (innerCanvas: D3Selection): D3Selection =>
    selectOrAdd(innerCanvas, '.nodes', (s) => s.append('g').classed('nodes', true));

export const selectEdgeGroup = (innerCanvas: D3Selection): D3Selection =>
    selectOrAdd(innerCanvas, '.edges', (s) => s.append('g').classed('edges', true));

export const selectNode = (nodeGroup: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    return selectOrAdd(nodeGroup, `#node-${renderId}`, (s) =>
        s.append('g').attr('id', `node-${renderId}`)
    );
};

export const selectEdge = (edgeGroup: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    return selectOrAdd(edgeGroup, `#edge-${renderId}`, (s) =>
        s.append('g').attr('id', `edge-${renderId}`)
    );
};
