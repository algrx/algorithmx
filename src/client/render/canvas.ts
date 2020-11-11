import * as d3 from './d3.modules';
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
import { renderNode } from './node';
import {
    selectCanvasContainer,
    selectInnerCanvas,
    selectEdgeGroup,
    selectNodeGroup,
    selectNode,
    selectCanvas,
} from './selectors';
import { LayoutState } from '../layout/canvas';
import { AnimAttrSpec } from '../attributes/components/animation';
import { asNum } from '../utils';
import { renderPanZoom, updatePanZoomBehaviour } from './canvas-panzoom';

export interface RenderState {
    readonly zoomBehaviour?: D3ZoomBehaviour;
}

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

const renderCanvas: RenderElementFn<CanvasSpec> = (selection, attrs, changes): void => {
    console.log(changes);
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

    const innerCanvas = selectInnerCanvas(selection);
    const labelGroup = selectOrAdd(innerCanvas, '.labels', (s) =>
        s.append('g').classed('labels', true)
    );
    const edgeGroup = selectEdgeGroup(innerCanvas);
    const nodeGroup = selectNodeGroup(innerCanvas);

    renderDict<NodeSpec>(attrs.nodes, changes.nodes, (k, a, c) =>
        renderElement(selectNode(nodeGroup, k), a, c, renderNode)
    );

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

export const renderLiveCanvas = (
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

export const renderAll = (
    canvas: CanvasElement,
    attrs: FullAttr<CanvasSpec>,
    changes: PartialAttr<CanvasSpec>,
    renderState: RenderState
): RenderState => {
    const canvasSel = selectCanvas(canvas);
    const innerCanvas = selectInnerCanvas(canvasSel);

    renderElement(canvasSel, attrs, changes, renderCanvas);

    const newZoomBehaviour = updatePanZoomBehaviour(
        canvasSel,
        attrs,
        changes,
        renderState.zoomBehaviour
    );
    renderPanZoom(canvasSel, attrs, changes, newZoomBehaviour);

    return {
        ...renderState,
        zoomBehaviour: newZoomBehaviour,
    };
};
