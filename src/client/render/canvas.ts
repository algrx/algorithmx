import * as d3 from './d3.modules';
import {
    RenderElementFn,
    renderDict,
    renderSvgDict,
    renderSvgAttr,
    renderElement,
    renderAnimAttr,
} from './common';
import { D3Selection, selectOrAdd, createRenderId, isSafari, D3ZoomBehaviour } from './utils';
import { renderNode } from './node';
import {
    selectCanvasContainer,
    selectInnerCanvas,
    selectEdgeGroup,
    selectNodeGroup,
    selectNode,
    selectCanvas,
    selectEdge,
} from './selectors';
import { AnimAttrSpec } from '../attributes/components/animation';
import { renderPanZoom, updatePanZoomBehaviour } from './canvas-panzoom';
import { NodeSpec } from '../attributes/components/node';
import { FullEvalAttr, PartialEvalAttr, FullAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { renderEdge } from './edge';
import { renderLiveEdges } from './live-edge';
import { getLiveNodeAttrs } from './live-node';
import { LayoutState } from '../layout/canvas';
import { Dict, mapDict } from '../utils';
import { CanvasElement, ReceiveEvent } from '../types';

export interface RenderState {
    readonly zoomBehaviour?: D3ZoomBehaviour;
    isMouseover: boolean;
    isDragging: boolean;
}

export interface RenderContext {
    readonly state: RenderState;
    readonly layout: LayoutState;
    readonly tick: () => void;
    readonly receive: (event: ReceiveEvent) => void;
}

export const initRenderState: RenderState = {
    isDragging: false,
    isMouseover: false,
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

const selectLabel = (labelGroup: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    return selectOrAdd(labelGroup, `#label-${renderId}`, (s) =>
        s.append('g').attr('id', `label-${renderId}`)
    );
};

const renderCanvasAttrs: RenderElementFn<CanvasSpec> = (canvasSel, attrs, changes) => {
    console.log(changes);
    renderSvgAttr(canvasSel, 'width', changes.size, (v) => v[0]);
    renderSvgAttr(canvasSel, 'height', changes.size, (v) => v[1]);

    // add an invisible rectangle to fix zooming in Safari
    if (isSafari()) {
        selectOrAdd(canvasSel, 'rect', (rectSel) =>
            rectSel
                .append('rect')
                .classed('safari-fix', true)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', 'none')
        );
    }

    const innerCanvas = selectInnerCanvas(canvasSel);
    const labelGroup = selectOrAdd(innerCanvas, '.labels', (s) =>
        s.append('g').classed('labels', true)
    );
    const edgeGroup = selectEdgeGroup(innerCanvas);
    const nodeGroup = selectNodeGroup(innerCanvas);

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

    if (changes.svgattrs) renderSvgDict(canvasSel, changes.svgattrs);
};

export const renderLive = (
    canvasEl: CanvasElement,
    attrs: FullEvalAttr<CanvasSpec>,
    layout: LayoutState
): void => {
    const canvasSel = selectCanvas(canvasEl);
    const innerCanvas = selectInnerCanvas(selectCanvas(canvasEl));

    const liveNodes = mapDict(attrs.nodes, (nodeAttrs, k) =>
        getLiveNodeAttrs(
            selectNode(selectNodeGroup(selectInnerCanvas(canvasSel)), k),
            layout.nodes[k],
            nodeAttrs
        )
    );

    Object.entries(liveNodes).forEach(([k, liveNode]) => {
        if (!attrs.nodes[k].visible) return;
        const nodeSel = selectNode(selectNodeGroup(innerCanvas), k);
        nodeSel.attr('transform', `translate(${liveNode.pos[0]},${-liveNode.pos[1]})`);
    });

    renderLiveEdges(canvasSel, liveNodes, attrs, layout);
};

export const renderCanvas = (
    canvasEl: CanvasElement,
    context: RenderContext,
    attrs: FullEvalAttr<CanvasSpec> | undefined,
    changes: PartialEvalAttr<CanvasSpec>
): RenderState => {
    const canvasSel = selectCanvas(canvasEl);
    renderElement(selectCanvas(canvasEl), attrs, changes, renderCanvasAttrs);

    if (!attrs || attrs.visible.value === false) return initRenderState;

    Object.entries(changes.nodes ?? {}).forEach(([k, nodeChanges]) => {
        renderNode([canvasSel, k], attrs.nodes[k], nodeChanges, context);
    });
    Object.entries(changes.edges ?? {}).forEach(([k, edgeChanges]) => {
        const edgeSel = selectEdge(selectEdgeGroup(selectInnerCanvas(canvasSel)), k);
        renderEdge(edgeSel, attrs.edges[k], edgeChanges);
    });

    const newZoomBehaviour = updatePanZoomBehaviour(
        canvasSel,
        attrs,
        changes,
        context.state.zoomBehaviour
    );
    renderPanZoom(canvasSel, attrs, changes, newZoomBehaviour);

    return {
        ...context.state,
        zoomBehaviour: newZoomBehaviour,
    };
};
