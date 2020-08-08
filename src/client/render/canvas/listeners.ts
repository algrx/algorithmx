import { ICanvasAttr } from '../../attributes/definitions/canvas';
import { RenderAttr } from '../process';
import { getEntry } from '../process';
import { Canvas } from '../../types/events';
import { selectCanvasInner, selectNodeGroup, selectNode } from './utils';
import * as canvasUtils from './utils';
import * as renderFns from '../render';
import * as renderElement from '../element';
import * as renderNode from '../node/render';
import * as renderNodeDrag from '../node/drag';

export const registerNodeHover = (
    canvas: Canvas,
    renderData: RenderAttr<ICanvasAttr>,
    onHover: (id: string, entered: boolean) => void
) => {
    const canvasSel = canvasUtils.selectCanvas(canvas);
    const nodeGroup = selectNodeGroup(selectCanvasInner(canvasSel));

    renderElement.renderVisibleLookup(getEntry(renderData, 'nodes'), (k, nodeDataInit) => {
        const sel = selectNode(nodeGroup, k);
        const nodeData = renderNode.preprocess(renderElement.preprocess(nodeDataInit));
        renderFns.onChanged(sel, getEntry(nodeData, 'hover'), (s, nodeHover) => {
            const hoverFn = nodeHover.attr
                ? (entered: boolean) => onHover(k, entered)
                : () => {
                      /**/
                  };
            renderNodeDrag.enableHover(canvasSel, s, hoverFn);
        });
    });
};

export const registerNodeClick = (
    canvas: Canvas,
    renderData: RenderAttr<ICanvasAttr>,
    onClick: (id: string) => void
) => {
    const nodeGroup = selectNodeGroup(selectCanvasInner(canvasUtils.selectCanvas(canvas)));

    renderElement.renderVisibleLookup(getEntry(renderData, 'nodes'), (k, nodeDataInit) => {
        const sel = selectNode(nodeGroup, k);
        const nodeData = renderNode.preprocess(renderElement.preprocess(nodeDataInit));
        renderFns.onChanged(sel, getEntry(nodeData, 'click'), (s, nodeClick) => {
            const clickFn = nodeClick.attr
                ? () => onClick(k)
                : () => {
                      /**/
                  };
            renderNodeDrag.enableClick(s, clickFn);
        });
    });
};
