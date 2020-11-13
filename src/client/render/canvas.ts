import * as d3 from './d3.modules';
import { CanvasElement, ReceiveEvent } from '../types';
import { NodeSpec } from '../attributes/components/node';
import { FullEvalAttr, PartialEvalAttr, FullAttr } from '../attributes/derived';
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
import { LayoutState } from '../layout/canvas';
import { AnimAttrSpec } from '../attributes/components/animation';
import { renderPanZoom, updatePanZoomBehaviour } from './canvas-panzoom';
import { renderEdge } from './edge';

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

const renderCanvasAttrs: RenderElementFn<CanvasSpec> = (canvasSel, attrs, changes): void => {
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
    attrs: FullAttr<CanvasSpec>,
    layout: LayoutState
): void => {
    const innerCanvas = selectInnerCanvas(selectCanvas(canvasEl));

    Object.entries(attrs.nodes).forEach(([k, nodeAttrs]) => {
        if (!nodeAttrs.visible) return;
        const nodeLayout = layout.nodes[k];
        const nodeSel = selectNode(selectNodeGroup(innerCanvas), k);
        nodeSel.attr('transform', `translate(${nodeLayout.x},${-nodeLayout.y})`);
    });

    Object.entries(attrs.edges).forEach(([k, edgeAttrs]) => {
        if (!edgeAttrs.visible) return;
        const edgeSel = selectEdge(selectEdgeGroup(innerCanvas), k);

        const origin = liveEdge.getEdgeOrigin(edge);
        edgeSel.attr(
            'transform',
            `translate(${origin[0]},${-origin[1]})rotate(${-math.angleToDeg(edge.angle)})`
        );

        const edgeLabels = renderEdge.selectLabelGroup(edgeSel);
        edgeLabels.attr('transform', liveEdge.shouldFlip(edge) ? 'scale(-1, -1)' : null);

        //liveEdge.renderEdgePath(edgeSel, edge, origin);
    });
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
