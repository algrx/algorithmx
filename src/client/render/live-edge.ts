import * as d3 from './d3.modules';
import { selectEdge } from './selectors';
import { D3Selection, selectOrAdd, createRenderId, isSafari, getColor, getCurveFn } from './utils';
import { LiveNodeAttrs, getLiveNodeAttrs, getPointAtNodeBoundary } from './live-node';
import { MARKER_SIZE } from './edge-marker';
import { EdgeSpec } from '../attributes/components/edge';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { CanvasSpec } from '../attributes/components/canvas';
import { LayoutState } from '../layout/canvas';
import { restrictAngle, translate, rotate, angleToDeg } from '../math';
import { Dict, mapDict } from '../utils';
import { NodeSpec } from '../attributes/components/node';
import { selectEdgeLabelGroup } from './edge';

export interface LiveEdgeAttrs {
    readonly angle: number;
}

const getLoopAngle = (
    canvasSel: D3Selection,
    layout: LayoutState,
    liveNodes: Dict<string, LiveNodeAttrs>,
    nodeId: string
): number => {
    const adjNodes = layout.adjList[nodeId].filter((n) => n !== nodeId);
    if (adjNodes.length === 0) return Math.PI;

    const sourcePos = liveNodes[nodeId].pos;

    const anglesAbs = adjNodes.map((n) => {
        const pos = liveNodes[n].pos;
        return restrictAngle(Math.atan2(pos[1] - sourcePos[1], pos[0] - sourcePos[0]));
    });

    const sortedAngles = anglesAbs.sort();
    const angleDiffs = sortedAngles.map((a, i) => {
        if (i === sortedAngles.length - 1) return Math.PI * 2 - a + sortedAngles[0];
        else return sortedAngles[i + 1] - a;
    });

    const maxDifIndex = angleDiffs.reduce(
        (maxIndex, a, i) => (a > angleDiffs[maxIndex] ? i : maxIndex),
        0
    );
    return restrictAngle(anglesAbs[maxDifIndex] + angleDiffs[maxDifIndex] / 2 - Math.PI / 2);
};

const getLiveEdgeAttrs = (
    canvasSel: D3Selection,
    layout: LayoutState,
    liveNodes: Dict<string, LiveNodeAttrs>,
    attrs: FullEvalAttr<EdgeSpec>
): LiveEdgeAttrs => {
    const liveSource = liveNodes[attrs.source];
    const liveTarget = liveNodes[attrs.target];

    const angle =
        attrs.source === attrs.target
            ? getLoopAngle(canvasSel, layout, liveNodes, attrs.source)
            : restrictAngle(
                  Math.atan2(
                      liveTarget.pos[1] - liveSource.pos[1],
                      liveTarget.pos[0] - liveSource.pos[0]
                  )
              );

    return { angle };
};

const shouldFlip = (attrs: FullEvalAttr<EdgeSpec>, liveAttrs: LiveEdgeAttrs): boolean => {
    return (
        attrs.flip &&
        attrs.source !== attrs.target &&
        liveAttrs.angle > Math.PI / 2 &&
        liveAttrs.angle <= (Math.PI * 3) / 2
    );
};

interface AllNeighborAttrs {
    readonly source: FullEvalAttr<NodeSpec>;
    readonly target: FullEvalAttr<NodeSpec>;
    readonly liveSource: LiveNodeAttrs;
    readonly liveTarget: LiveNodeAttrs;
}

export const getEdgeOrigin = (
    { source, target, liveSource, liveTarget }: AllNeighborAttrs,
    [attrs, liveAttrs]: [FullEvalAttr<EdgeSpec>, LiveEdgeAttrs]
): [number, number] => {
    if (attrs.source === attrs.target)
        return getPointAtNodeBoundary([source, liveSource], liveAttrs.angle + Math.PI / 2);
    else {
        const sourcePoint = getPointAtNodeBoundary([source, liveSource], liveAttrs.angle);
        const targetPoint = getPointAtNodeBoundary([target, liveTarget], liveAttrs.angle + Math.PI);
        return [(sourcePoint[0] + targetPoint[0]) / 2, (sourcePoint[1] + targetPoint[1]) / 2];
    }
};

export const renderEdgePath = (
    edgeSel: D3Selection,
    { source, target, liveSource, liveTarget }: AllNeighborAttrs,
    [attrs, liveAttrs]: [FullEvalAttr<EdgeSpec>, LiveEdgeAttrs],
    origin: [number, number]
) => {
    const edgePath = shouldFlip(attrs, liveAttrs)
        ? attrs.path.map(([x, y]) => [x, -y] as [number, number])
        : attrs.path;

    const pointBeforeSource =
        edgePath.length === 0 ? origin : translate(rotate(edgePath[0], liveAttrs.angle), origin);
    const pointBeforeTarget =
        edgePath.length === 0
            ? origin
            : translate(rotate(edgePath[edgePath.length - 1], liveAttrs.angle), origin);

    const angleAtSource = Math.atan2(
        pointBeforeSource[1] - liveSource.pos[1],
        pointBeforeSource[0] - liveSource.pos[0]
    );
    const angleAtTarget = Math.atan2(
        pointBeforeTarget[1] - liveTarget.pos[1],
        pointBeforeTarget[0] - liveTarget.pos[0]
    );

    const targetOffset = attrs.directed ? MARKER_SIZE / 2 : 0;
    const pointAtSource = getPointAtNodeBoundary([source, liveSource], angleAtSource, 0);
    const pointAtTarget = getPointAtNodeBoundary([target, liveTarget], angleAtTarget, targetOffset);

    const pointAtSourceRel = rotate(
        translate(pointAtSource, [-origin[0], -origin[1]]),
        -liveAttrs.angle
    );
    const pointAtTargetRel = rotate(
        translate(pointAtTarget, [-origin[0], -origin[1]]),
        -liveAttrs.angle
    );

    const lineFunction = d3.shape
        .line()
        .x((d) => d[0])
        .y((d) => -d[1])
        .curve(getCurveFn(attrs.curve));
    const line = lineFunction([pointAtSourceRel, ...edgePath, pointAtTargetRel])!;

    edgeSel.select('.edge-path').attr('d', line);
    const overlay = edgeSel.select('.edge-path-overlay');
    if (!overlay.empty()) overlay.attr('d', line);
};

export const renderLiveEdges = (
    canvasSel: D3Selection,
    canvasAttrs: FullEvalAttr<CanvasSpec>,
    liveNodes: Dict<string, LiveNodeAttrs>,
    layout: LayoutState
) => {
    Object.entries(canvasAttrs.edges).forEach(([k, attrs]) => {
        if (!attrs.visible) return;

        const edgeSel = selectEdge(canvasSel, k);

        const source = canvasAttrs.nodes[attrs.source];
        const target = canvasAttrs.nodes[attrs.target];
        const liveSource = liveNodes[attrs.source];
        const liveTarget = liveNodes[attrs.target];

        const liveAttrs = getLiveEdgeAttrs(canvasSel, layout, liveNodes, attrs);

        const origin = getEdgeOrigin({ source, target, liveSource, liveTarget }, [
            attrs,
            liveAttrs,
        ]);
        edgeSel.attr(
            'transform',
            `translate(${origin[0]},${-origin[1]})rotate(${-angleToDeg(liveAttrs.angle)})`
        );

        const labelGroup = selectEdgeLabelGroup(edgeSel);
        if (shouldFlip(attrs, liveAttrs)) labelGroup.attr('transform', 'scale(-1,-1)');
        else labelGroup.attr('transform', null);

        renderEdgePath(
            edgeSel,
            { source, target, liveSource, liveTarget },
            [attrs, liveAttrs],
            origin
        );
    });
};
