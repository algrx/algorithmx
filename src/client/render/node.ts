import * as d3 from './d3.modules';
import { NodeSpec, nodeSpec, NodeShape } from '../attributes/components/node';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
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
    parseColor,
    isTransition,
    transition,
} from './utils';
import { RenderState, RenderContext } from './canvas';
import { selectInnerCanvas, selectNode, selectNodeGroup } from './selectors';
import { assignKeys, dictKeys } from '../utils';
import { updateNodeListeners } from './node-events';
import { renderLabel } from './label';

const selectLabel = (nodeSel: D3Selection, id: string): D3Selection => {
    const labelGroup = selectOrAdd(nodeSel, '.node-labels', (s) =>
        s.append('g').classed('node-labels', true)
    );
    const renderId = createRenderId(id);
    return selectOrAdd(labelGroup, `#label-${renderId}`, (s) =>
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
    size: PartialEvalAttr<NodeSpec['entries']['size']>
): void => {
    if (shape === 'circle') {
        renderSvgAttr(selection, 'r', size, (v) => v[0]);
    } else if (shape === 'rect') {
        renderSvgAttr(selection, 'width', size, (v) => v[0] * 2);
        renderSvgAttr(selection, 'height', size, (v) => v[1] * 2);

        renderSvgAttr(selection, ['x', 'width-pos'], size, (v) => -v[0]);
        renderSvgAttr(selection, ['y', 'height-pos'], size, (v) => -v[1]);
    } else if (shape === 'ellipse') {
        renderSvgAttr(selection, 'rx', size, (v) => v[0]);
        renderSvgAttr(selection, 'ry', size, (v) => v[1]);
    }
};

const renderNodeAttrs: RenderElementFn<NodeSpec> = (nodeSel, attrs, initChanges) => {
    /*
    const posAttrs = combineAttrs(labelSpec, attrs, initChanges, (a, c, k) => {
        return k === 'pos' || k === 'radius' || k === 'rotate' || k === 'angle' ? c ?? a : undefined;
    }) as PartialEvalAttr<NodeSpec>
    */

    const changes = initChanges.shape
        ? assignKeys(
              initChanges,
              attrs,
              dictKeys(nodeSpec.entries).filter(
                  (k) => k !== 'pos' && k !== 'visible' && k !== 'labels'
              )
          )
        : initChanges;

    if (changes.shape) renderShape(nodeSel, changes.shape);
    const shapeSel = nodeSel.select('.shape');

    renderSvgAttr(shapeSel, 'fill', changes.color, (v) => parseColor(v));
    if (changes.size) renderSize(shapeSel, attrs.shape, changes.size);
    if (changes.svgattrs) renderSvgDict(shapeSel, changes.svgattrs);
};

const renderWithTick = (
    nodeSel: D3Selection,
    attrs: FullEvalAttr<NodeSpec>,
    changes: PartialEvalAttr<NodeSpec>,
    tick: () => void
) => {
    // changing node size requires the live layout function to be called continuously,
    // so that connected edges are animated as well
    if (changes.size?.value !== undefined) {
        renderAnimAttr(nodeSel, 'live-size', changes.size, (sel) => {
            if (isTransition(sel)) {
                const selWithSize = sel
                    .attr('_width', changes.size!.value![0])
                    .attr('_height', changes.size!.value![1]);

                return selWithSize.tween(name, () => () => {
                    tick();
                });
            }
            return sel;
        });

        transition(nodeSel, 'live-size-remove', (t) =>
            t.delay((changes.size!.duration ?? 0) * 1000)
        )
            .attr('_width', null)
            .attr('_height', null);
    }
};

export const renderNode = (
    [canvasSel, nodeId]: [D3Selection, string],
    attrs: FullEvalAttr<NodeSpec> | undefined,
    changes: PartialEvalAttr<NodeSpec>,
    context: RenderContext
) => {
    const nodeSel = selectNode(selectNodeGroup(selectInnerCanvas(canvasSel)), nodeId);
    renderElement(nodeSel, attrs, changes, renderNodeAttrs);

    if (!attrs || attrs.visible.value === false) return;

    renderWithTick(nodeSel, attrs, changes, context.tick);

    Object.entries(changes.labels ?? {}).forEach(([k, labelChanges]) => {
        const labelSel = selectLabel(nodeSel, k);
        renderLabel(labelSel, attrs.labels[k], labelChanges);
    });

    updateNodeListeners([canvasSel, nodeSel, nodeId], changes, context);
};
