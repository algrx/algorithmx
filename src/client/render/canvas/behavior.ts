import { ICanvasAttr } from '../../attributes/definitions/canvas';
import { RenderAttr } from '../process';
import { Canvas } from '../../types/events';
import { getEntry } from '../process';
import { D3Selection, D3Zoom } from '../utils';
import * as canvasUtils from './utils';
import * as renderProcess from '../process';
import * as renderFns from '../render';
import * as d3 from '../d3.modules';

export interface RenderBehavior {
    readonly zoom: D3Zoom;
}

const updatePanZoomLimit = (
    selection: D3Selection,
    renderData: RenderAttr<ICanvasAttr>,
    behavior: RenderBehavior['zoom'] | undefined
): RenderBehavior['zoom'] => {
    if (
        renderProcess.hasChanged(getEntry(renderData, 'zoomlimit')) ||
        renderProcess.hasChanged(getEntry(renderData, 'panlimit')) ||
        renderProcess.hasChanged(getEntry(renderData, 'zoomkey')) ||
        behavior === undefined
    ) {
        const onZoom = () => {
            canvasUtils
                .selectCanvasInner(selection)
                .attr('transform', d3.event ? d3.event.transform : '');
        };

        const zoomFilter = (requiresKey: boolean) => {
            if (d3.event && d3.event.type === 'wheel' && requiresKey) {
                return d3.event.ctrlKey || d3.event.metaKey;
            } else return true;
        };

        const panH = renderData.attr.panlimit.horizontal;
        const panV = renderData.attr.panlimit.vertical;
        const zoomKey = renderData.attr.zoomkey;
        const newBehavior = d3
            .zoom()
            .translateExtent([
                [-panH, -panV],
                [panH, panV],
            ])
            .scaleExtent([renderData.attr.zoomlimit.min, renderData.attr.zoomlimit.max])
            .on('zoom', onZoom)
            .filter(() => zoomFilter(zoomKey));

        selection.call(newBehavior);

        return newBehavior;
    } else return behavior;
};

const updatePanZoom = (
    selection: D3Selection,
    renderData: RenderAttr<ICanvasAttr>,
    behavior: RenderBehavior | undefined
): RenderBehavior => {
    const zoomBehavior = updatePanZoomLimit(
        selection,
        renderData,
        behavior ? behavior.zoom : undefined
    );
    return { ...behavior, zoom: zoomBehavior };
};

const renderPanZoom = (
    selection: D3Selection,
    renderData: RenderAttr<ICanvasAttr>,
    behavior: RenderBehavior
): void => {
    const panZoomData = renderProcess.combine({
        pos: renderProcess.flatten(getEntry(renderData, 'pan')),
        scale: getEntry(renderData, 'zoom'),
        size: renderProcess.flatten(getEntry(renderData, 'size')),
    });
    renderFns.render(selection, panZoomData, (sel, panZoom) => {
        const panCenter: [number, number] = [
            panZoom.size.width / 2 - panZoom.pos.x * panZoom.scale,
            panZoom.size.height / 2 + panZoom.pos.y * panZoom.scale,
        ];
        const transform = d3.zoomIdentity
            .translate(panCenter[0], panCenter[1])
            .scale(panZoom.scale);
        return (sel as D3Selection).call(behavior.zoom.transform, transform);
    });
};

export const update = (
    canvas: Canvas,
    renderData: RenderAttr<ICanvasAttr>,
    behavior: RenderBehavior | undefined
): RenderBehavior => {
    return updatePanZoom(canvasUtils.selectCanvas(canvas), renderData, behavior);
};

export const render = (
    canvas: Canvas,
    renderData: RenderAttr<ICanvasAttr>,
    behavior: RenderBehavior
): void => {
    renderPanZoom(canvasUtils.selectCanvas(canvas), renderData, behavior);
};
