import * as d3 from './d3.modules';
import { EdgeSpec } from '../attributes/components/edge';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import {
    D3Selection,
    selectOrAdd,
    parseColor,
    D3SelTrans,
    isTransition,
    newTransition,
    transition,
} from './utils';
import { getEdgeMarkerId, selectEdgeMarker } from './edge-marker';
import { renderHighlightAttr, renderAnimAttr, renderSvgAttr } from './common';

const getPathLength = (pathSel: D3Selection) => (pathSel.node() as SVGPathElement).getTotalLength();

const tweenOverlay = (
    overlaySel: D3SelTrans,
    pathLengthFn: () => number,
    isReverse: boolean,
    isEntering: boolean
): D3SelTrans => {
    if (isTransition(overlaySel)) {
        return overlaySel.attrTween('stroke-dashoffset', () => {
            const pathLength = pathLengthFn();
            if (isEntering)
                return (t: number) => (pathLength - (isReverse ? -t : t) * pathLength).toString();
            else
                return (t: number) =>
                    (pathLength * 2 - (isReverse ? -t : t) * pathLength).toString();
        });
    } else return overlaySel.attr('stroke-dashoffset', isEntering ? 0 : pathLengthFn());
};

export const renderTraverse = (
    [edgeSel, pathSel]: [D3Selection, D3Selection],
    attrs: FullEvalAttr<EdgeSpec>,
    changes: PartialEvalAttr<EdgeSpec>
): void => {
    if (!changes.color?.value) return;

    edgeSel.select('.edge-path-overlay').remove();
    const overlaySel = edgeSel
        .append('path')
        .classed('edge-path-overlay', true)
        .attr('fill', 'none')
        .attr('stroke-linecap', 'butt');

    if (attrs.directed) overlaySel.attr('marker-end', `url(#${getEdgeMarkerId(edgeSel, 'target')}`);

    const isReverse = !changes.color.animsource ? false : changes.color.animsource !== attrs.source;
    const pathLengthInit = getPathLength(pathSel);

    overlaySel
        .attr('stroke-dasharray', pathLengthInit)
        .attr('stroke-dashoffset', pathLengthInit)
        .attr('stroke', parseColor(changes.color.value))
        .attr('stroke-width', attrs.thickness.value + 2);

    const renderIn = (s: D3SelTrans): D3SelTrans => {
        const trans = s.attr('stroke-width', attrs.thickness.value);
        return tweenOverlay(trans, () => getPathLength(pathSel), isReverse, true);
    };

    if (changes.color.highlight !== undefined) {
        const renderOut = (sel: D3SelTrans): D3SelTrans => {
            sel.on('start', () => {
                const pathLength = getPathLength(pathSel);
                overlaySel.attr('stroke-dasharray', pathLength);
            });
            const trans = tweenOverlay(sel, () => getPathLength(pathSel), isReverse, false);
            return newTransition(trans, (t) => t.duration(0)).remove();
        };
        renderHighlightAttr(overlaySel, 'color-traverse', changes.color, [renderIn, renderOut]);
    } else {
        renderAnimAttr(overlaySel, 'color-traverse', changes.color, renderIn);

        const animDuration = (changes.color.duration ?? 0) * 1000;
        const endDuration = animDuration / 3;

        transition(pathSel, 'color-traverse', (t) =>
            t.delay(animDuration).duration(endDuration)
        ).attr('stroke', parseColor(changes.color.value));

        const removeTrans = newTransition(overlaySel.attr('opacity', 1), (t) =>
            t.delay(animDuration + endDuration).duration(endDuration)
        ).attr('opacity', 0);

        newTransition(removeTrans, (t) => t.duration(0)).remove();
    }
};

export const renderEdgeColor = (
    [edgeSel, pathSel]: [D3Selection, D3Selection],
    attrs: FullEvalAttr<EdgeSpec>,
    changes: PartialEvalAttr<EdgeSpec>
): void => {
    if (!changes.color?.value) return;
    if (changes.color.animtype === 'traverse') renderTraverse([edgeSel, pathSel], attrs, changes);
    else renderSvgAttr(pathSel, 'stroke', changes.color, (v) => parseColor(v));

    if (attrs.directed)
        renderSvgAttr(selectEdgeMarker(edgeSel, 'target'), 'fill', changes.color, (v) =>
            parseColor(v)
        );
};
