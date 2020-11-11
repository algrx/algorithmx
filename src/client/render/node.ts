import * as d3 from './d3.modules';
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
import { isNum, assignKeys, dictKeys, asNum } from '../utils';

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
    selectOrAdd(sel, '.node-labels', (s) => s.append('g').classed('node-labels', true));

export const selectLabel = (sel: D3Selection, id: string): D3Selection => {
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
    switch (shape) {
        case 'circle':
            renderSvgAttr(selection, 'r', size, (v) => v[0]);
            break;
        case 'rect':
            renderSvgAttr(selection, 'width', size, (v) => asNum(v[0]) * 2);
            renderSvgAttr(selection, 'height', size, (v) => asNum(v[1]) * 2);

            renderSvgAttr(selection, ['x', 'width-pos'], size, (v) => -asNum(v[0]));
            renderSvgAttr(selection, ['y', 'height-pos'], size, (v) => -asNum(v[1]));
            break;
        case 'ellipse':
            renderSvgAttr(selection, 'rx', size, (v) => v[0]);
            renderSvgAttr(selection, 'ry', size, (v) => v[1]);
            break;
    }
};

export const renderNodeWithTick = (
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

export const renderNode: RenderElementFn<NodeSpec> = (selection, attrs, initChanges): void => {
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
