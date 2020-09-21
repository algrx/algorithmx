import { NodeVar } from './expression';
import { CanvasVar, NodeLabelVar, nodeVars } from './expression';
import {
    AttrType,
    DictSpec,
    RecordSpec,
    BoolSpec,
    NumSpec,
    AnyStringSpec,
    StringSpec,
    EndpointSpec,
    TupleSpec,
    Entries,
    ArraySpec,
} from '../attr-spec';
import { FullAttr, PartialAttr } from '../derived-attr';
import { WithCommonSpec, withCommonSpec, commonDefaults, CommonSpec } from './common';
import {
    ElementSpec,
    SvgSpec,
    elementSpecEntries,
    svgSpecEntries,
    elementDefaults,
    svgDefaults,
} from './element';
import { LabelSpec, labelSpec, labelDefaults, createLabelDictDefaults } from './label';
import { COLORS } from '../../render/utils';
import { mapDict, filterDict, mergeDiff } from '../../utils';
import { combineAttrs, mapAttr } from '../attr-utils';
import { VarDict, evalAttr, evalDeep, usesVars } from '../expr-utils';
import { angleToDeg } from '../../math';

export const edgeCurve = <const>[
    'basis',
    'bundle',
    'cardinal',
    'catmull-rom',
    'linear',
    'monotone-x',
    'monotone-y',
    'natural',
    'step',
    'step-before',
    'step-after',
];
export type EdgeCurve = typeof edgeCurve[number];

export type EdgeSpec = RecordSpec<
    {
        readonly labels: DictSpec<LabelSpec>;
        readonly source: WithCommonSpec<AnyStringSpec>;
        readonly target: WithCommonSpec<AnyStringSpec>;
        readonly directed: WithCommonSpec<BoolSpec>;
        readonly length: WithCommonSpec<NumSpec>;
        readonly thickness: WithCommonSpec<NumSpec>;
        readonly flip: WithCommonSpec<BoolSpec>;
        readonly color: WithCommonSpec<AnyStringSpec>;
        readonly curve: WithCommonSpec<StringSpec<EdgeCurve>>;
        readonly path: WithCommonSpec<ArraySpec<TupleSpec<NumSpec>>>;
    } & Entries<ElementSpec> &
        Entries<SvgSpec>
>;

export const edgeSpec: EdgeSpec = {
    type: AttrType.Record,
    entries: {
        labels: {
            type: AttrType.Dict,
            entry: labelSpec,
        },
        source: withCommonSpec({ type: AttrType.String }),
        target: withCommonSpec({ type: AttrType.String }),
        directed: withCommonSpec({ type: AttrType.Boolean }),
        length: withCommonSpec({ type: AttrType.Number }),
        thickness: withCommonSpec({ type: AttrType.Number }),
        flip: withCommonSpec({ type: AttrType.Boolean }),
        color: withCommonSpec({ type: AttrType.String }),
        curve: withCommonSpec({ type: AttrType.String, validValues: edgeCurve }),
        path: withCommonSpec({
            type: AttrType.Array,
            entry: {
                type: AttrType.Tuple,
                entry: { type: AttrType.Number },
            },
        }),
        ...elementSpecEntries,
        ...svgSpecEntries,
    },
};

export const edgeDefaults: FullAttr<EdgeSpec> = {
    labels: {},
    source: { ...commonDefaults, value: '' },
    target: { ...commonDefaults, value: '' },
    directed: { ...commonDefaults, value: false },
    length: { ...commonDefaults, value: 70 },
    thickness: { ...commonDefaults, value: 2.5 },
    color: { ...commonDefaults, value: COLORS.lightgray },
    flip: { ...commonDefaults, value: true },
    curve: { ...commonDefaults, value: 'natural' },
    path: { ...commonDefaults, value: [] },
    ...elementDefaults,
    ...svgDefaults,
};

const edgeLabelDefaults: FullAttr<LabelSpec> = mergeDiff(labelDefaults, {
    align: { value: 'radial' },
    rotate: { value: true },
    size: { value: 11 },
    radius: { value: 3 },
});

export const createEdgeDefaults = (
    attrs: FullAttr<EdgeSpec> | undefined,
    changes: PartialAttr<EdgeSpec>
): FullAttr<EdgeSpec> => {
    if (!changes.labels) return edgeDefaults;

    const labelDictDefaults = createLabelDictDefaults(attrs?.labels, changes.labels!);

    // new labels should be positioned radially around the center of the edge's path
    const prevLabelKeys = Object.keys(attrs?.labels ?? {});
    const newLabels = mapDict(
        filterDict(changes.labels!, (_, k) => !(k in prevLabelKeys)),
        (labelChanges, k, i) => {
            const path = changes.path?.value ?? attrs?.path?.value ?? edgeDefaults.path.value;
            const pathMidY = path.length === 0 ? 0 : path[Math.floor((path.length - 1) / 2)][1];
            const pathMidYNum = typeof pathMidY === 'number' ? pathMidY : 0;

            const index = prevLabelKeys.length + i;
            const angle = index % 2 === 0 ? Math.PI / 2 : (Math.PI * 3) / 2;

            return mergeDiff(labelDictDefaults[k], {
                pos: { value: [0, pathMidYNum] },
                angle: { value: angleToDeg(angle) },
            });
        }
    );

    return {
        ...edgeDefaults,
        labels: {
            ...labelDictDefaults,
            ...newLabels,
        },
    };
};

interface EdgeAdjMatrix {
    readonly [k: string]: { readonly [k: string]: number };
}
const incrementMatrix = (matrix: EdgeAdjMatrix, source: string, target: string): EdgeAdjMatrix => {
    const sourceAdj = matrix[source] ?? {};
    const targetAdj = matrix[target] ?? {};

    const sourceLookup = {
        ...sourceAdj,
        [target]: sourceAdj[target] ? sourceAdj[target] + 1 : 1,
    };
    const targetLookup = {
        ...targetAdj,
        [source]: targetAdj[source] ? targetAdj[source] + 1 : 1,
    };

    return { ...matrix, [source]: sourceLookup, [target]: targetLookup };
};

const createAdjMatrix = (edges: FullAttr<DictSpec<EdgeSpec>>): EdgeAdjMatrix => {
    return Object.values(edges).reduce((matrix, e) => {
        return incrementMatrix(matrix, e.source.value, e.target.value);
    }, {} as EdgeAdjMatrix);
};

export const createEdgeDictDefaults = (
    attrs: FullAttr<DictSpec<EdgeSpec>> | undefined,
    changes: PartialAttr<DictSpec<EdgeSpec>>
): FullAttr<DictSpec<EdgeSpec>> => {
    const numPrevEdges = Object.keys(attrs ?? {}).length;
    const newEdges = Object.entries(changes)
        .filter(([k]) => !attrs || !(k in attrs))
        .reduce(
            (acc, [k, edgeChanges], i) => {
                // edges are expected to be provided with source and target attributes initially
                const source = edgeChanges.source?.value ?? '';
                const target = edgeChanges.target?.value ?? '';

                const newMatrix = incrementMatrix(acc.matrix, source, target);
                const index = newMatrix[source][target] - 1;

                const loopingPath = (i: number): ReadonlyArray<[number, number]> => [
                    [-(i + 1) * 8, 8],
                    [-(i + 1) * 10, 14 + (i + 1) * 6],
                    [0, 14 + (i + 1) * 14],
                    [(i + 1) * 10, 14 + (i + 1) * 6],
                    [(i + 1) * 8, 8],
                ];

                const newEdgeDefaults = mergeDiff(createEdgeDefaults(undefined, changes[k]!), {
                    path: {
                        value:
                            source === target
                                ? loopingPath(index)
                                : [[0, Math.pow(-1, index + 1) * Math.ceil(index / 2) * 16]],
                    },
                });
                return { matrix: newMatrix, edges: { ...acc.edges, [k]: newEdgeDefaults } };
            },
            { matrix: createAdjMatrix(attrs ?? {}), edges: {} as FullAttr<DictSpec<EdgeSpec>> }
        ).edges;

    return {
        '*': edgeDefaults,
        ...mapDict(changes, (edgeChanges, k) => {
            return newEdges[k] ?? createEdgeDefaults(attrs?.[k], edgeChanges);
        }),
    };
};
