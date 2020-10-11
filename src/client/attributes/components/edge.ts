import {
    AttrType,
    DictSpec,
    RecordSpec,
    BoolSpec,
    NumSpec,
    StringSpec,
    ExactStringSpec,
    TupleSpec,
    RecordEntries,
    ArraySpec,
} from '../spec';
import { FullAttr, PartialAttr } from '../derived';
import { WithAnimSpec, withAnimSpec, animDefaults } from './animation';
import { ElementSpec, elementSpecEntries, elementDefaults } from './element';
import { LabelSpec, labelSpec, labelDefaults, createLabelDictDefaults } from './label';
import { COLORS } from './color';
import { combineAttrs, mapAttr } from '../attr-utils';
import { mapDict, filterDict, mergeDiff } from '../../utils';
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
        readonly source: StringSpec;
        readonly target: StringSpec;
        readonly directed: BoolSpec;
        readonly length: NumSpec;
        readonly thickness: WithAnimSpec<NumSpec>;
        readonly flip: BoolSpec;
        readonly color: RecordSpec<
            RecordEntries<WithAnimSpec<StringSpec>> & {
                readonly animtype: ExactStringSpec<'color' | 'traverse'>;
                readonly animsource: StringSpec;
            }
        >;
        readonly curve: ExactStringSpec<EdgeCurve>;
        readonly path: ArraySpec<TupleSpec<NumSpec>>;
    } & RecordEntries<ElementSpec>
>;

export const edgeSpec: EdgeSpec = {
    type: AttrType.Record,
    entries: {
        labels: {
            type: AttrType.Dict,
            entry: labelSpec,
        },
        source: { type: AttrType.String },
        target: { type: AttrType.String },
        directed: { type: AttrType.Boolean },
        length: { type: AttrType.Number },
        thickness: withAnimSpec({ type: AttrType.Number }),
        flip: { type: AttrType.Boolean },
        color: {
            type: AttrType.Record,
            entries: {
                ...withAnimSpec({ type: AttrType.String }).entries,
                animtype: { type: AttrType.String, validValues: ['color', 'traverse'] },
                animsource: { type: AttrType.String },
            },
        },
        curve: { type: AttrType.String, validValues: edgeCurve },
        path: {
            type: AttrType.Array,
            entry: {
                type: AttrType.Tuple,
                entry: { type: AttrType.Number },
            },
        },
        ...elementSpecEntries,
    },
};

export const edgeDefaults: FullAttr<EdgeSpec> = {
    labels: {},
    source: '',
    target: '',
    directed: false,
    length: 70,
    thickness: { ...animDefaults, value: 2.5 },
    color: {
        ...animDefaults,
        value: COLORS.lightgray,
        animtype: 'color',
        animsource: '',
    },
    flip: true,
    curve: 'natural',
    path: [],
    ...elementDefaults,
};

const edgeLabelDefaults: FullAttr<LabelSpec> = mergeDiff(labelDefaults, {
    align: 'radial',
    rotate: true,
    size: { value: 11 },
    radius: { value: 3 },
});

export const createEdgeDefaults = (
    prevAttrs: FullAttr<EdgeSpec> | undefined,
    changes: PartialAttr<EdgeSpec>
): FullAttr<EdgeSpec> => {
    if (!changes.labels) return edgeDefaults;

    const labelDictDefaults = createLabelDictDefaults(prevAttrs?.labels, changes.labels!);

    // new labels should be positioned radially around the center of the edge's path
    const prevLabelKeys = Object.keys(prevAttrs?.labels ?? {});
    const newLabels = mapDict(
        filterDict(changes.labels!, (_, k) => !(k in prevLabelKeys)),
        (labelChanges, k, i) => {
            const path = changes.path ?? prevAttrs?.path ?? edgeDefaults.path;
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
        color: {
            ...edgeDefaults.color,
            animsource: prevAttrs?.source ?? changes.source ?? '',
        },
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
        return incrementMatrix(matrix, e.source, e.target);
    }, {} as EdgeAdjMatrix);
};

// "source-target(-ID)" to [source, target, ID?]
export const parseEdgeId = (
    id: string
): [string, string] | [string, string, string] | undefined => {
    const split = id.split('-');
    if (split.length < 2) return undefined;

    if (split.length >= 3) return [split[0], split[1], split.slice(2).join('-')];
    else return [split[0], split[1]];
};

export const createEdgeDictDefaults = (
    prevAttrs: FullAttr<DictSpec<EdgeSpec>> | undefined,
    changes: PartialAttr<DictSpec<EdgeSpec>>
): FullAttr<DictSpec<EdgeSpec>> => {
    const numPrevEdges = Object.keys(prevAttrs ?? {}).length;
    const newEdges = Object.entries(changes)
        .filter(([k]) => !prevAttrs || !(k in prevAttrs))
        .reduce(
            (acc, [k, edgeChanges], i) => {
                // e.g. parse "source->target" to { source, target, directed: true }
                const parsedId = parseEdgeId(k);

                // edges are expected to be provided with source and target attributes initially
                const source = edgeChanges.source ?? parsedId?.[0] ?? '';
                const target = edgeChanges.target ?? parsedId?.[1] ?? '';

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
                    source,
                    target,
                    path:
                        source === target
                            ? loopingPath(index)
                            : [[0, Math.pow(-1, index + 1) * Math.ceil(index / 2) * 16]],
                });
                return { matrix: newMatrix, edges: { ...acc.edges, [k]: newEdgeDefaults } };
            },
            { matrix: createAdjMatrix(prevAttrs ?? {}), edges: {} as FullAttr<DictSpec<EdgeSpec>> }
        ).edges;

    return {
        '*': edgeDefaults,
        ...mapDict(changes, (edgeChanges, k) => {
            return newEdges[k] ?? createEdgeDefaults(prevAttrs?.[k], edgeChanges);
        }),
    };
};
