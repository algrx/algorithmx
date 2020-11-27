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

export const selectNodeGroup = (canvasSel: D3Selection): D3Selection =>
    selectOrAdd(selectInnerCanvas(canvasSel), '.nodes', (s) =>
        s.append('g').classed('nodes', true)
    );

export const selectEdgeGroup = (canvasSel: D3Selection): D3Selection =>
    selectOrAdd(selectInnerCanvas(canvasSel), '.edges', (s) =>
        s.append('g').classed('edges', true)
    );

export const selectNode = (canvasSel: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    const nodeGroup = selectNodeGroup(canvasSel);
    return selectOrAdd(nodeGroup, `#node-${renderId}`, (s) =>
        s.append('g').attr('id', `node-${renderId}`)
    );
};

export const selectEdge = (canvasSel: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    const edgeGroup = selectEdgeGroup(canvasSel);
    return selectOrAdd(edgeGroup, `#edge-${renderId}`, (s) =>
        s.append('g').attr('id', `edge-${renderId}`)
    );
};
