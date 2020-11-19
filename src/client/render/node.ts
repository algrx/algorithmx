import * as d3 from './d3.modules';
import { NodeSpec, nodeSpec, NodeShape } from '../attributes/components/node';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import {
    RenderElementFn,
    renderAnimAttr,
    renderSvgDict,
    renderSvgAttr,
    getAllElementChanges,
    renderVisRemove,
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
import { renderLabel } from './label';
import { selectInnerCanvas, selectNode, selectNodeGroup } from './selectors';
import { assignKeys, dictKeys } from '../utils';
import { registerNodeListeners } from './node-listeners';

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
    nodeSel: D3Selection,
    attrs: FullEvalAttr<NodeSpec>,
    changes: PartialEvalAttr<NodeSpec>
): void => {
    if (!changes.size?.value) return;

    if (attrs.shape === 'circle') {
        renderSvgAttr(nodeSel, 'r', [attrs.size, changes.size], (v) => v[0]);
    } else if (attrs.shape === 'rect') {
        renderSvgAttr(nodeSel, 'width', [attrs.size, changes.size], (v) => v[0] * 2);
        renderSvgAttr(nodeSel, 'height', [attrs.size, changes.size], (v) => v[1] * 2);

        renderSvgAttr(nodeSel, ['x', 'width-pos'], [attrs.size, changes.size], (v) => -v[0]);
        renderSvgAttr(nodeSel, ['y', 'height-pos'], [attrs.size, changes.size], (v) => -v[1]);
    } else if (attrs.shape === 'ellipse') {
        renderSvgAttr(nodeSel, 'rx', [attrs.size, changes.size], (v) => v[0]);
        renderSvgAttr(nodeSel, 'ry', [attrs.size, changes.size], (v) => v[1]);
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

    renderSvgAttr(shapeSel, 'fill', [attrs.color, changes.color], (v) => parseColor(v));
    if (changes.size) renderSize(shapeSel, attrs, changes);
    if (changes.svgattrs) renderSvgDict(shapeSel, attrs.svgattrs, changes.svgattrs);
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
        renderAnimAttr(
            nodeSel,
            [changes.size, 'live-size'],
            [attrs.size, changes.size],
            (sel, v) => {
                if (isTransition(sel)) {
                    const selWithSize = sel
                        .attr('_width', v.value![0])
                        .attr('_height', v.value![1]);

                    return selWithSize.tween(name, () => () => {
                        tick();
                    });
                }
                return sel;
            }
        );

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
    initChanges: PartialEvalAttr<NodeSpec>,
    context: RenderContext
) => {
    const nodeSel = selectNode(selectNodeGroup(selectInnerCanvas(canvasSel)), nodeId);
    const changes = getAllElementChanges(nodeSpec, attrs, initChanges);

    renderVisRemove(nodeSel, changes.visible, changes.remove);
    if (attrs?.visible.value === true) renderNodeAttrs(nodeSel, attrs, changes);
    else return;

    Object.entries(changes.labels ?? {}).forEach(([k, labelChanges]) => {
        const labelSel = selectLabel(nodeSel, k);
        renderLabel(labelSel, attrs.labels[k], labelChanges);
    });

    renderWithTick(nodeSel, attrs, changes, context.tick);
    registerNodeListeners([canvasSel, nodeSel, nodeId], changes, context);
};
