import * as d3 from './d3.modules';
import { NodeSpec, nodeSpec, NodeShape } from '../attributes/components/node';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { getAllElementChanges, renderVisRemove } from './element';
import {
    RenderAttrFn,
    renderWithAnim,
    renderSvgDict,
    renderSvgAttr,
    D3Selection,
    selectOrAdd,
    createRenderId,
    getColor,
    isTransition,
    transition,
} from './utils';
import { RenderState, RenderContext } from './canvas';
import { renderLabel } from './label';
import { selectNode } from './selectors';
import { registerNodeListeners } from './node-listeners';
import { combineAttrs } from '../attributes/utils';

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

const renderSize: RenderAttrFn<NodeSpec> = (nodeSel, attrs, changes) => {
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

const renderNodeAttrs: RenderAttrFn<NodeSpec> = (nodeSel, attrs, initChanges) => {
    // if the node shape changes, re-render everything except visible/labels/pos
    const changes =
        initChanges.shape !== undefined
            ? (combineAttrs(nodeSpec, attrs, initChanges, (a, c, k) => {
                  return k !== 'visible' && k !== 'labels' && k !== 'pos' ? c ?? a : c;
              }) as PartialEvalAttr<NodeSpec>)
            : initChanges;

    if (changes.shape) renderShape(nodeSel, changes.shape);
    const shapeSel = nodeSel.select('.shape');

    renderSvgAttr(shapeSel, 'fill', [attrs.color, changes.color], (v) => getColor(v));
    renderSize(shapeSel, attrs, changes);

    if (changes.svgattrs) renderSvgDict(shapeSel, attrs.svgattrs, changes.svgattrs);
};

const renderWithTick = (
    nodeSel: D3Selection,
    attrs: FullEvalAttr<NodeSpec>,
    changes: PartialEvalAttr<NodeSpec>,
    tick: () => void
) => {
    // changing node size requires the tick function to be called continuously,
    // so that connected edges are animated as well
    if (changes.size?.value !== undefined) {
        renderWithAnim(
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
    const nodeSel = selectNode(canvasSel, nodeId);
    const changes = getAllElementChanges(nodeSpec, attrs, initChanges);

    renderVisRemove(nodeSel, changes.visible, changes.remove);
    if (attrs?.visible.value === true) renderNodeAttrs(nodeSel, attrs, changes);
    else return;

    Object.entries(changes.labels ?? {}).forEach(([k, labelChanges]) => {
        renderLabel(selectLabel(nodeSel, k), attrs.labels[k], labelChanges);
    });

    renderWithTick(nodeSel, attrs, changes, context.tick);
    registerNodeListeners([canvasSel, nodeSel, nodeId], changes, context);
};
