import { D3Selection, createRenderId } from '../src/client/render/utils';
import { CanvasElement } from '../src/client/types';
import * as d3 from '../src/client/render/d3.modules';
import { selectCanvas as realSelectCanvas } from '../src/client/render/selectors';
import 'mocha';

export const GREEN = 'rgb(0,255,0)';
export const RED = 'rgb(255,0,0)';

export const createDiv = (width = 100, height = 100): HTMLDivElement => {
    const container = document.createElement('div');
    container.setAttribute('style', `width: ${width}px; height: ${height}px;`);
    return container;
};

export const removeSpaces = (s: string): string => s.replace(/\s/g, '');

export const selectCanvas = (canvasEl: CanvasElement): D3Selection => realSelectCanvas(canvasEl);

export const selectNode = (canvasEl: CanvasElement, id: string | number): D3Selection => {
    const renderId = createRenderId(String(id));
    return selectCanvas(canvasEl).select('.nodes').select(`[id="node-${renderId}"]`);
};
export const selectNodeLabel = (nodeSel: D3Selection, id: string | number): D3Selection => {
    const renderId = createRenderId(String(id));
    return nodeSel.select('.node-labels').select(`[id="label-${renderId}"]`);
};
export const getNodeAttr = (canvasEl: CanvasElement, id: string | number, attr: string) =>
    selectNode(canvasEl, id).select('.shape').attr(attr);

export const getNodeColor = (canvasEl: CanvasElement, id: string | number) =>
    removeSpaces(getNodeAttr(canvasEl, id, 'fill'));

type EdgeSelector = [string | number, string | number, (string | number)?];

export const selectEdge = (canvasEl: CanvasElement, edge: EdgeSelector): D3Selection => {
    const edgeId = `${edge[0]}-${edge[1]}${edge[2] !== undefined ? '-' + edge[2] : ''}`;
    const renderId = createRenderId(edgeId);
    return selectCanvas(canvasEl).select('.edges').select(`[id="edge-${renderId}"]`);
};
export const getEdgeAttr = (canvas: CanvasElement, edge: EdgeSelector, attr: string) =>
    selectEdge(canvas, edge).select('.edge-path').attr(attr);

export const getEdgeColor = (canvas: CanvasElement, edge: EdgeSelector) =>
    removeSpaces(getEdgeAttr(canvas, edge, 'stroke'));

export const getLabelAttr = (label: D3Selection, attr: string) => label.select('text').attr(attr);

export const getTranslation = (transform: string): [number, number] => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttributeNS(null, 'transform', transform);
    const matrix = g.transform.baseVal.consolidate().matrix;
    return [matrix.e, -matrix.f];
};

export const getD3 = () => d3;
