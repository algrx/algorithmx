import { ElementSpec, elementSpecEntries, elementDefaults } from './element';
import { CanvasVar, canvasVars } from './expression';
import { WithAnimSpec, withAnimSpec, animDefaults } from './animation';
import { LabelSpec, labelSpec, labelDefaults, createLabelDictDefaults } from './label';
import { NodeSpec, nodeSpec, createNodeDictDefaults, evalNodeChanges } from './node';
import { EdgeSpec, edgeSpec, createEdgeDictDefaults, edgeDefaults, parseEdgeId } from './edge';
import { COLORS } from './color';
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
import { nonEmpty, combineAttrs } from '../utils';
import { VarDict, evalAnimAttr, usesVars, evalDeep, EvalChangesFn } from '../expression';
import { mergeDiff, mapDict, isObjEmpty } from '../../utils';

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

export const evalCanvasChanges: EvalChangesFn<CanvasSpec, string> = ({
    prevAttrs,
    prevExprs,
    changes,
    selfRefOnly,
}) => {
    // get node variables from attributes
    const canvasVars: VarDict<CanvasVar> = {
        cx: evalAnimAttr({}, prevExprs.size ?? prevAttrs?.size, changes.size, (v) => v[0]),
        cy: evalAnimAttr({}, prevExprs.size ?? prevAttrs?.size, changes.size, (v) => v[0]),
    };

    // evaluate child attributes
    return combineAttrs(
        canvasSpec,
        prevExprs,
        changes,
        (prevChildExprs, childChanges, childKey, childSpec) => {
            if (childKey === 'nodes') {
                const nodeDict = combineAttrs(
                    canvasSpec.entries.nodes,
                    prevExprs.nodes,
                    changes.nodes,
                    (prevNodeExprs, nodeChanges, k) => {
                        if (nodeChanges)
                            return evalNodeChanges({
                                prevAttrs: prevAttrs?.nodes[k],
                                prevExprs: prevNodeExprs ?? {},
                                changes: nodeChanges,
                                selfRefOnly,
                                parentVars: canvasVars,
                            });
                        else if (!selfRefOnly)
                            return evalDeep(nodeSpec, prevNodeExprs, nodeChanges, canvasVars);
                        else return undefined;
                    }
                );
                return isObjEmpty(nodeDict) ? childChanges : nodeDict;
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
                    return evalDeep(childSpec, prevChildExprs, childChanges, canvasVars);
                }

                return childChanges;
            }

            return evalDeep(childSpec, prevChildExprs, childChanges, canvasVars);
        }
    );
};
