import * as d3 from './d3.modules';
import * as webcola from 'webcola';

import { NodeSpec } from '../attributes/components/node';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { D3Selection } from './utils';
import { RenderState, RenderContext } from './canvas';
import { ReceiveEvent } from '../types';

const updateDrag = (
    [canvasSel, nodeSel, nodeId]: [D3Selection, D3Selection, string],
    changes: PartialEvalAttr<NodeSpec>,
    context: RenderContext
) => {
    if (changes.draggable === true) {
        const nodeLayout = context.layout.nodes[nodeId];
        nodeSel.call(
            d3
                .drag()
                .subject(() => {
                    const origin = webcola.Layout.dragOrigin(nodeLayout);
                    return { ...origin, y: -origin.y };
                })
                .on('start', () => {
                    context.state.isDragging = true;
                    canvasSel.style('cursor', 'pointer');
                    webcola.Layout.dragStart(nodeLayout);
                })
                .on('drag', (event) => {
                    webcola.Layout.drag(nodeLayout, { x: event.x, y: -event.y });
                    context.layout.cola.resume();
                })
                .on('end', () => {
                    context.state.isDragging = false;
                    if (!context.state.isMouseover) canvasSel.style('cursor', null);
                    webcola.Layout.dragEnd(nodeLayout);
                })
        );
    }
    if (changes.draggable === false) nodeSel.on('.drag', null);
};

export const registerNodeListeners = (
    [canvasSel, nodeSel, nodeId]: [D3Selection, D3Selection, string],
    changes: PartialEvalAttr<NodeSpec>,
    context: RenderContext
) => {
    if (changes.listenclick !== undefined) {
        nodeSel.on('click', (event) => {
            if (event.defaultPrevented) return;
            if (changes.listenclick === true)
                context.receive({ nodes: { [nodeId]: { click: true } } });
        });
    }
    if (changes.listenhover !== undefined) {
        nodeSel.on('mouseover', () => {
            context.state.isMouseover = true;
            if (!context.state.isDragging) {
                canvasSel.style('cursor', 'pointer');
                if (changes.listenhover)
                    context.receive({ nodes: { [nodeId]: { hoverin: true } } });
            }
        });
        nodeSel.on('mouseout', () => {
            context.state.isMouseover = false;
            if (!context.state.isDragging) {
                canvasSel.style('cursor', null);
                if (changes.listenhover)
                    context.receive({ nodes: { [nodeId]: { hoverin: false } } });
            }
        });
    }

    updateDrag([canvasSel, nodeSel, nodeId], changes, context);
};
