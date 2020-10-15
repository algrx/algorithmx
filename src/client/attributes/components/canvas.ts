import { nonEmpty } from '../attr-utils';
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
import { EdgeSpec, edgeSpec, createEdgeDictDefaults, edgeDefaults, parseEdgeId } from './edge';
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
    prevAttrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>
): FullAttr<CanvasSpec> => {
    return {
        ...canvasDefaults,
        nodes: createNodeDictDefaults(prevAttrs?.nodes, changes.nodes ?? {}),
        edges: createEdgeDictDefaults(prevAttrs?.edges, changes.edges ?? {}),
        labels: mapDict(createLabelDictDefaults(prevAttrs?.labels, changes.labels ?? {}), (label) =>
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
    prevAttrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>,
    selfRefOnly: boolean
): PartialAttr<NodeSpec> => {
    // get node variables from attributes
    const canvasVars: VarDict<CanvasVar> = {
        cx: evalAttr(prevAttrs?.size.value[0], changes.size?.value?.[0], {}),
        cy: evalAttr(prevAttrs?.size.value[1], changes.size?.value?.[1], {}),
    };

    // evaluate child attributes
    return combineAttrs(
        canvasSpec,
        prevAttrs,
        changes,
        (childAttr, childChanges, childKey, childSpec) => {
            if (childKey === 'nodes') {
                const nodeDict = combineAttrs(
                    canvasSpec.entries.nodes,
                    prevAttrs?.nodes,
                    changes.nodes,
                    (prevNode, nodeChanges) => {
                        if (nodeChanges)
                            return evalNode(
                                prevNode as FullAttr<NodeSpec> | undefined,
                                nodeChanges,
                                canvasVars,
                                selfRefOnly
                            );

                        if (!selfRefOnly)
                            return evalDeep(nodeSpec, prevNode, nodeChanges, canvasVars);

                        return undefined;
                    }
                );
                return nonEmpty(nodeDict);
            }

            if (selfRefOnly) {
                // only evaluate self-referential attributes (e.g. size = '2cx')
                if (
                    childKey === 'size' &&
                    changes.size &&
                    changes.size.value &&
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
