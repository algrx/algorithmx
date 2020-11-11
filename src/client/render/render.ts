import * as d3 from './d3.modules';
import { renderPanZoom, updatePanZoomBehaviour } from './canvas-panzoom';
import { renderCanvas } from './canvas';
import { CanvasElement } from '../types';
import { NodeSpec } from '../attributes/components/node';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import {
    RenderElementFn,
    renderDict,
    renderSvgDict,
    renderSvgAttr,
    renderElement,
    renderAnimAttr,
} from './common';
import { D3Selection, selectOrAdd, createRenderId, isSafari, D3ZoomBehaviour } from './utils';
import {
    selectCanvasContainer,
    selectInnerCanvas,
    selectEdgeGroup,
    selectNodeGroup,
    selectNode,
    selectCanvas,
} from './selectors';
import { LayoutState } from '../layout/canvas';
import { renderNodeWithTick } from './node';

export interface RenderState {
    readonly zoomBehaviour?: D3ZoomBehaviour;
}

export const renderLive = (
    canvasEl: CanvasElement,
    attrs: FullAttr<CanvasSpec>,
    layout: LayoutState
): void => {
    const innerCanvas = selectInnerCanvas(selectCanvas(canvasEl));

    Object.entries(attrs.nodes).forEach(([k, nodeAttrs]) => {
        if (nodeAttrs.visible) {
            const nodeLayout = layout.nodes[k];
            const nodeSel = selectNode(selectNodeGroup(innerCanvas), k);
            nodeSel.attr('transform', `translate(${nodeLayout.x},${-nodeLayout.y})`);
        }
    });
};

export const renderWithTick = (
    canvasEl: CanvasElement,
    attrs: FullAttr<CanvasSpec>,
    changes: PartialAttr<CanvasSpec>,
    tick: () => void
) => {
    const canvasSel = selectCanvas(canvasEl);

    Object.entries(changes.nodes ?? {}).forEach(([k, nodeChanges]) => {
        if (!attrs || !attrs.nodes[k] || attrs.nodes[k]?.visible.value === false) return;

        const nodeSel = selectNode(selectNodeGroup(canvasSel), k);
        renderNodeWithTick(nodeSel, attrs.nodes[k], nodeChanges, tick);
    });
};
export const renderWithLayout = (
    canvasEl: CanvasElement,
    attrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>,
    layout: LayoutState
): void => {
    const canvasSel = selectCanvas(canvasEl);

    Object.entries(changes.nodes ?? {}).forEach(([k, nodeChanges]) => {
        if (attrs?.nodes[k]?.visible.value === false) return;
        const nodeSel = selectNode(selectNodeGroup(canvasSel), k);
        /*
        if (changes.draggable === true) enableDrag(canvasSel, nodeSel, layoutState.cola, layoutState.nodes[k]);
        elseif (!nodeAttrs || changes.draggable === false) disableDrag(selection);
        */
    });
};

export const renderWithState = (
    canvasEl: CanvasElement,
    attrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>,
    state: RenderState
): RenderState => {
    if (!attrs) return {};

    const canvasSel = selectCanvas(canvasEl);
    const newZoomBehaviour = updatePanZoomBehaviour(canvasSel, attrs, changes, state.zoomBehaviour);
    renderPanZoom(canvasSel, attrs, changes, newZoomBehaviour);

    return {
        ...state,
        zoomBehaviour: newZoomBehaviour,
    };
};

export const renderAttrs = (
    canvasEl: CanvasElement,
    attrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>
) => {
    renderElement(selectCanvas(canvasEl), attrs, changes, renderCanvas);
};
