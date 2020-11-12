import * as d3 from './d3.modules';
import * as webcola from 'webcola';
import { NodeSpec, nodeSpec, NodeShape } from '../attributes/components/node';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import {
    RenderElementFn,
    renderAnimAttr,
    renderDict,
    renderSvgDict,
    renderSvgAttr,
    renderElement,
} from './common';
import {
    D3Selection,
    selectOrAdd,
    createRenderId,
    isSafari,
    parseColor,
    isTransition,
} from './utils';
import { RenderState, RenderContext } from './canvas';
import { selectInnerCanvas, selectNode, selectNodeGroup } from './selectors';
import { isNum, assignKeys, dictKeys, asNum } from '../utils';
import { ReceiveEvent } from '../types';

const selectLabelGroup = (sel: D3Selection): D3Selection =>
    selectOrAdd(sel, '.node-labels', (s) => s.append('g').classed('node-labels', true));

const selectLabel = (sel: D3Selection, id: string): D3Selection => {
    const renderId = createRenderId(id);
    return selectOrAdd(sel, `#label-${renderId}`, (s) =>
        s.append('g').attr('id', `label-${renderId}`)
    );
};

const renderShape = (selection: D3Selection, shape: NodeShape) => {
    selection.select('.shape').remove();
    const shapeSel = selection.insert(shape, ':first-child').classed('shape', true);
    if (shape === 'rect') shapeSel.attr('rx', 4).attr('ry', 4);
    return shapeSel;
};

const renderSize = (
    selection: D3Selection,
    shape: NodeShape,
    size: PartialAttr<NodeSpec['entries']['size']>
): void => {
    if (shape === 'circle') {
        renderSvgAttr(selection, 'r', size, (v) => v[0]);
    } else if (shape === 'rect') {
        renderSvgAttr(selection, 'width', size, (v) => asNum(v[0]) * 2);
        renderSvgAttr(selection, 'height', size, (v) => asNum(v[1]) * 2);

        renderSvgAttr(selection, ['x', 'width-pos'], size, (v) => -asNum(v[0]));
        renderSvgAttr(selection, ['y', 'height-pos'], size, (v) => -asNum(v[1]));
    } else if (shape === 'ellipse') {
        renderSvgAttr(selection, 'rx', size, (v) => v[0]);
        renderSvgAttr(selection, 'ry', size, (v) => v[1]);
    }
};

const renderNodeAttrs: RenderElementFn<NodeSpec> = (selection, attrs, initChanges): void => {
    const changes = initChanges.shape
        ? assignKeys(
              initChanges,
              attrs,
              dictKeys(nodeSpec.entries).filter(
                  (k) => k !== 'pos' && k !== 'visible' && k !== 'labels'
              )
          )
        : initChanges;

    if (changes.shape) renderShape(selection, changes.shape);

    const shapeSelection = selection.select('.shape');
    const labelGroup = selectLabelGroup(selection);

    /*
    renderElementDict(
        attrs?.labels,
        changes.labels,
        (k, a, c) => renderLabel(selectLabel(labelGroup, k), a, c),
    );
    */

    renderSvgAttr(selection, 'fill', changes.color, (v) => parseColor(v));

    if (changes.size) renderSize(shapeSelection, attrs.shape, changes.size);
    if (changes.svgattrs) renderSvgDict(shapeSelection, changes.svgattrs);
};

const renderWithTick = (
    nodeSel: D3Selection,
    attrs: FullAttr<NodeSpec>,
    changes: PartialAttr<NodeSpec>,
    tick: () => void
) => {
    // changing node size requires the live layout function to be called continuously,
    // so that connected edges are animated as well
    if (changes.size) {
        renderAnimAttr(nodeSel, 'live-size', changes.size, (sel) => {
            const selWithSize = sel
                .attr('_width', asNum(changes.size!.value?.[0]))
                .attr('_height', asNum(changes.size!.value?.[1]));

            if (isTransition(selWithSize))
                return selWithSize.tween(name, () => () => {
                    tick();
                });
            return selWithSize;
        });
    }
};

export const renderNode = (
    [canvasSel, nodeId]: [D3Selection, string],
    attrs: FullAttr<NodeSpec> | undefined,
    changes: PartialAttr<NodeSpec>,
    context: RenderContext
) => {
    const nodeSel = selectNode(selectNodeGroup(selectInnerCanvas(canvasSel)), nodeId);
    renderElement(nodeSel, attrs, changes, renderNodeAttrs);

    if (!attrs || attrs.visible.value === false) return;

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
