import {
    AttrType,
    DictSpec,
    RecordSpec,
    BoolSpec,
    NumSpec,
    ExactStringSpec,
    TupleSpec,
    RecordEntries,
} from '../spec';
import { FullAttr, PartialAttr } from '../derived';
import { ElementSpec, elementSpecEntries, elementDefaults } from './element';
import { CanvasVar, canvasVars } from './expression';
import { WithAnimSpec, withAnimSpec, animDefaults } from './animation';
import { LabelSpec, labelSpec, labelDefaults, createLabelDictDefaults } from './label';
import { NodeSpec, nodeSpec, createNodeDictDefaults, evalNode } from './node';
import { EdgeSpec, edgeSpec, createEdgeDictDefaults, edgeDefaults } from './edge';
import { COLORS } from './color';
import { mergeDiff, mapDict } from '../../utils';
import { VarDict, evalAttr, usesVars, evalDeep } from '../expr-utils';
import { combineAttrs } from '../attr-utils';

export const edgeLengthType = <const>['individual', 'symmetric', 'jaccard'];
export type EdgeLayout = typeof edgeLengthType[number];

export type CanvasSpec = RecordSpec<
    {
        readonly nodes: DictSpec<NodeSpec>;
        readonly edges: DictSpec<EdgeSpec>;
        readonly labels: DictSpec<LabelSpec>;
        readonly size: WithAnimSpec<TupleSpec<NumSpec>>;
        readonly edgelayout: ExactStringSpec<EdgeLayout>;
        readonly edgelength: NumSpec;
        readonly pan: WithAnimSpec<TupleSpec<NumSpec>>;
        readonly zoom: WithAnimSpec<NumSpec>;
        readonly panlimit: TupleSpec<NumSpec>;
        readonly zoomlimit: TupleSpec<NumSpec>;
        readonly zoomtoggle: BoolSpec;
    } & RecordEntries<ElementSpec>
>;

export const canvasSpec: CanvasSpec = {
    type: AttrType.Record,
    entries: {
        nodes: {
            type: AttrType.Dict,
            entry: nodeSpec,
        },
        edges: {
            type: AttrType.Dict,
            entry: edgeSpec,
        },
        labels: {
            type: AttrType.Dict,
            entry: labelSpec,
        },
        size: withAnimSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        edgelayout: { type: AttrType.String, validValues: edgeLengthType },
        edgelength: { type: AttrType.Number },
        pan: withAnimSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        zoom: withAnimSpec({ type: AttrType.Number }),
        panlimit: { type: AttrType.Tuple, entry: { type: AttrType.Number } },
        zoomlimit: { type: AttrType.Tuple, entry: { type: AttrType.Number } },
        zoomtoggle: { type: AttrType.Boolean },
        ...elementSpecEntries,
    },
    validVars: canvasVars,
};

export const canvasDefaults: FullAttr<CanvasSpec> = {
    nodes: {},
    edges: {},
    labels: {},
    size: {
        ...animDefaults,
        value: [100, 100],
        duration: 0,
    },
    edgelayout: 'jaccard',
    edgelength: 70,
    pan: { ...animDefaults, value: [0, 0] },
    zoom: { ...animDefaults, value: 1 },
    panlimit: [Infinity, Infinity],
    zoomlimit: [0.1, 10],
    zoomtoggle: false,
    ...elementDefaults,
};

export const createCanvasDefaults = (
    attrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>
): FullAttr<CanvasSpec> => {
    return {
        ...canvasDefaults,
        nodes: createNodeDictDefaults(attrs?.nodes, changes.nodes ?? {}),
        edges: createEdgeDictDefaults(attrs?.edges, changes.edges ?? {}),
        labels: mapDict(createLabelDictDefaults(attrs?.labels, changes.labels ?? {}), (label) =>
            mergeDiff(label, {
                align: 'middle',
                pos: { value: [0, { m: 0.5, x: 'cy', c: 0 }] },
                rotate: true,
                color: { value: COLORS.gray },
                size: { value: 20 },
            })
        ),
    };
};

export const evalCanvas = (
    attrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>,
    selfRefOnly: boolean
): PartialAttr<NodeSpec> => {
    // get node variables from attributes
    const canvasVars: VarDict<CanvasVar> = {
        cx: evalAttr(attrs?.size.value[0], changes.size?.value?.[0], {}),
        cy: evalAttr(attrs?.size.value[1], changes.size?.value?.[1], {}),
    };

    // evaluate child attributes
    return combineAttrs(
        canvasSpec,
        attrs,
        changes,
        (childAttr, childChanges, childKey, childSpec) => {
            if (childKey === 'nodes') {
                return combineAttrs(
                    canvasSpec.entries.nodes,
                    attrs?.nodes,
                    changes.nodes,
                    (nodeAttrs, nodeChanges) => {
                        if (nodeChanges)
                            return evalNode(
                                nodeAttrs as FullAttr<NodeSpec> | undefined,
                                nodeChanges,
                                canvasVars,
                                selfRefOnly
                            );

                        if (!selfRefOnly)
                            return evalDeep(nodeSpec, nodeAttrs, nodeChanges, canvasVars);

                        return undefined;
                    }
                );
            }

            if (selfRefOnly) {
                // only evaluate self-referential attributes (e.g. size = '2cx')
                if (
                    childKey === 'size' &&
                    changes.size!.value &&
                    (usesVars(changes.size!.value[0], ['cx', 'cy']) ||
                        usesVars(changes.size!.value[1], ['cx', 'cy']))
                ) {
                    return evalDeep(childSpec, childAttr, childChanges, canvasVars);
                }

                return childChanges;
            }

            return evalDeep(childSpec, childAttr, childChanges, canvasVars);
        }
    );
};

// remove edges connected to nodes which are being removed
export const removeInvalidEdges = (
    attrs: FullAttr<CanvasSpec>,
    changes: PartialAttr<CanvasSpec>
): PartialAttr<CanvasSpec> => {
    const isValid = (edgeId: string): boolean => {
        if (!changes.nodes) return true;

        const source = changes.edges?.[edgeId].source ?? attrs.edges[edgeId].source;
        const target = changes.edges?.[edgeId].target ?? attrs.edges[edgeId].target;

        // check if the node is being removed
        if (changes.nodes[source]?.visible?.value === false) return false;
        if (changes.nodes[target]?.visible?.value === false) return false;

        return true;
    };

    return combineAttrs(
        canvasSpec.entries.edges,
        attrs?.edges,
        changes.edges,
        (edgeAttrs, edgeChanges, k) => {
            if (edgeAttrs && !isValid(k))
                return { visible: { ...edgeDefaults.visible, value: false } };

            return edgeChanges;
        }
    );
};
