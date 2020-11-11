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

export const renderCanvas: RenderElementFn<CanvasSpec> = (canvasSel, attrs, changes): void => {
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

    Object.entries(changes.nodes ?? {}).forEach(([k, nodeChanges]) =>
        renderElement(selectNode(nodeGroup, k), attrs.nodes[k], nodeChanges, renderNode)
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

    if (changes.svgattrs) renderSvgDict(canvasSel, changes.svgattrs);
};
