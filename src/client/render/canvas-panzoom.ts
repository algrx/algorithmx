import * as d3 from './d3.modules';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { renderAnimAttr } from './common';
import { D3Selection, D3ZoomBehaviour } from './utils';
import {
    selectCanvasContainer,
    selectInnerCanvas,
    selectEdgeGroup,
    selectNodeGroup,
    selectNode,
    selectCanvas,
} from './selectors';
import { AnimAttrSpec } from '../attributes/components/animation';

export const updatePanZoomBehaviour = (
    canvasSel: D3Selection,
    attrs: FullEvalAttr<CanvasSpec>,
    changes: PartialEvalAttr<CanvasSpec>,
    zoomBehaviour: D3ZoomBehaviour | undefined
): D3ZoomBehaviour => {
    if (
        changes.zoomlimit ||
        changes.panlimit ||
        changes.zoomtoggle ||
        zoomBehaviour === undefined
    ) {
        const newZoomBehaviour = d3
            .zoom()
            .translateExtent([
                [-attrs.panlimit[0], -attrs.panlimit[1]],
                [attrs.panlimit[0], attrs.panlimit[1]],
            ])
            .scaleExtent([attrs.zoomlimit[0], attrs.zoomlimit[1]])
            .on('zoom', (event) => selectInnerCanvas(canvasSel).attr('transform', event.transform))
            .filter((event) =>
                attrs.zoomtoggle && event.type === 'wheel' ? event.ctrlKey || event.metaKey : true
            );

        canvasSel.call(newZoomBehaviour);
        return newZoomBehaviour;
    } else return zoomBehaviour;
};

export const renderPanZoom = (
    canvasSel: D3Selection,
    attrs: FullEvalAttr<CanvasSpec>,
    changes: PartialEvalAttr<CanvasSpec>,
    zoomBehaviour: D3ZoomBehaviour
) => {
    if (changes.pan || changes.zoom || changes.size) {
        const panZoomAnim: PartialEvalAttr<AnimAttrSpec> =
            changes.pan ?? changes.zoom ?? changes.size!;

        renderAnimAttr(canvasSel, 'pan-zoom', panZoomAnim, (sel) => {
            const panCenter: [number, number] = [
                attrs.size.value[0] / 2 - attrs.pan.value[0] * attrs.zoom.value,
                attrs.size.value[1] / 2 + attrs.pan.value[1] * attrs.zoom.value,
            ];
            const transform = d3.zoomIdentity
                .translate(panCenter[0], panCenter[1])
                .scale(attrs.zoom.value);

            return sel.call(zoomBehaviour.transform, transform);
        });
    }
};
