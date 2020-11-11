import * as d3 from './d3.modules';
import { NodeSpec, nodeSpec, NodeShape } from '../attributes/components/node';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { RenderElementFn, renderAnimAttr } from './attribute';
import { renderDict, renderSvgDict, renderSvgAttr, renderElement } from './element';
import { D3Selection, selectOrAdd, createRenderId, isSafari, parseColor } from './utils';
import { isNum, assignKeys, dictKeys } from '../utils';

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
            renderSvgAttr(selection, 'width', size, (v) => isNum(v[0]) && v[0] * 2);
            renderSvgAttr(selection, 'height', size, (v) => isNum(v[1]) && v[1] * 2);

            renderSvgAttr(selection, ['x', 'x-pos'], size, (v) => isNum(v[0]) && -v[0]);
            renderSvgAttr(selection, ['y', 'y-pos'], size, (v) => isNum(v[1]) && -v[1]);
            break;
        case 'ellipse':
            renderSvgAttr(selection, 'rx', size, (v) => v[0]);
            renderSvgAttr(selection, 'ry', size, (v) => v[1]);
            break;
    }
};

/*
export const renderVisible: renderFns.RenderAttrFn<NodeSpec['visible']> = (
    selection,
    renderData
) => {
    renderElement.renderVisible(selection.select('.node'), renderData);
};
*/
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
