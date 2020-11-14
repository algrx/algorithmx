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
} from '../spec';
import { FullAttr, PartialAttr } from '../derived';
import { WithAnimSpec, withAnimSpec, animDefaults } from './animation';
import { ElementSpec, elementSpecEntries, elementDefaults } from './element';
import { CanvasVar, NodeVar, NodeLabelVar, nodeVars, nodeLabelVars } from './expression';
import { LabelSpec, labelSpec, labelDefaults, createLabelDictDefaults } from './label';
import { COLORS } from './color';
import { combineAttrs, mapAttr, nonEmpty } from '../utils';
import { VarDict, evalAnimAttr, evalDeep, usesVars, EvalChangesFn } from '../expression';
import { angleToRad, radiusAtAngleRect, angleToDeg } from '../../math';
import { mapDict, filterDict, mergeDiff, isObjEmpty } from '../../utils';

export const nodeShape = <const>['circle', 'rect', 'ellipse'];
export type NodeShape = typeof nodeShape[number];

export type NodeSpec = RecordSpec<
    {
        readonly labels: DictSpec<LabelSpec>;
        readonly shape: ExactStringSpec<NodeShape>;
        readonly color: WithAnimSpec<StringSpec>;
        readonly size: WithAnimSpec<TupleSpec<NumSpec>>;
        readonly pos: WithAnimSpec<TupleSpec<NumSpec>>;
        readonly fixed: BoolSpec;
        readonly draggable: BoolSpec;
        readonly listenclick: BoolSpec;
        readonly listenhover: BoolSpec;
    } & RecordEntries<ElementSpec>
>;

export const nodeSpec: NodeSpec = {
    type: AttrType.Record,
    entries: {
        labels: {
            type: AttrType.Dict,
            entry: {
                ...labelSpec,
                validVars: nodeLabelVars,
            },
        },
        shape: { type: AttrType.String, validValues: nodeShape },
        color: withAnimSpec({ type: AttrType.String }),
        size: withAnimSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        pos: withAnimSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        fixed: { type: AttrType.Boolean },
        draggable: { type: AttrType.Boolean },
        listenclick: { type: AttrType.Boolean },
        listenhover: { type: AttrType.Boolean },
        ...elementSpecEntries,
    },
    validVars: nodeVars,
};

export const VALUE_LABEL_ID = '0';

const nodeDefaults: FullAttr<NodeSpec> = {
    labels: {},
    shape: 'circle',
    color: { ...animDefaults, value: COLORS.darkgray },
    size: { ...animDefaults, value: [12, 12] },
    pos: { ...animDefaults, value: [0, 0] },
    fixed: false,
    draggable: true,
    listenclick: false,
    listenhover: false,
    ...elementDefaults,
};

export const radiusAtAngle = (angle: number, rx: number, ry: number, shape: NodeShape): number => {
    if (shape === 'rect' || shape === 'ellipse') return radiusAtAngleRect(angle, rx, ry);
    else return rx;
};

const initPos = (index: number, offset: number): [number, number] => {
    // arrange nodes in a spiral pattern
    const sqrtOffset = Math.floor(Math.sqrt(index));
    const sizeInit = Math.pow(sqrtOffset, 2) !== index ? sqrtOffset + 1 : sqrtOffset;
    const size = sizeInit % 2 === 0 ? sizeInit + 1 : sizeInit;
    const halfSize = Math.floor(size / 2.0);
    const difference = Math.pow(size, 2) - index;

    const rawPos: [number, number] =
        difference <= size
            ? [-halfSize + (size - difference), -halfSize]
            : difference <= size * 2 - 1
            ? [-halfSize, -halfSize + (difference - size)]
            : difference <= size * 3 - 2
            ? [-halfSize + (difference - size * 2) + 1, halfSize]
            : [halfSize, -halfSize + (size - (difference - size * 3 + 3))];

    return [rawPos[0] * (offset + 1), rawPos[1] * (offset + 1)];
};

export const createNodeDefaults = (
    prevAttrs: FullAttr<NodeSpec> | undefined,
    changes: PartialAttr<NodeSpec>
): FullAttr<NodeSpec> => {
    if (!changes.labels) return nodeDefaults;

    const labelDictDefaults = createLabelDictDefaults(prevAttrs?.labels, changes.labels!);

    // new labels with any key other than 'value' should be positioned
    // radially around the node by default
    const prevLabelKeys = Object.keys(prevAttrs?.labels ?? {});
    const numPrevRadialLabels = prevLabelKeys.filter((k) => k !== VALUE_LABEL_ID).length;
    const newRadialLabels = mapDict(
        filterDict(changes.labels ?? {}, (_, k) => k !== VALUE_LABEL_ID && !(k in prevLabelKeys)),
        (labelChanges, k, i) => {
            // calculate an angle around the node
            const radialIndex = numPrevRadialLabels + i;
            const labelAngle =
                (Math.PI * 3) / 4 -
                (Math.PI / 2) * (radialIndex % 4) -
                Math.floor(radialIndex / 4) * (Math.PI / 4);

            // apply label defaults
            return mergeDiff(labelDictDefaults[k], {
                text: k,
                radius: { value: { m: 1, x: 'r', c: 3 } },
                angle: { value: angleToDeg(labelAngle) },
                align: 'radial',
            });
        }
    );

    return {
        ...nodeDefaults,
        labels: {
            ...labelDictDefaults,
            ...newRadialLabels,
        },
    };
};

export const createNodeDictDefaults = (
    prevAttrs: FullAttr<DictSpec<NodeSpec>> | undefined,
    changes: PartialAttr<DictSpec<NodeSpec>>
): FullAttr<DictSpec<NodeSpec>> => {
    const numPrevNodes = Object.keys(prevAttrs ?? {}).length;
    const newNodes = mapDict(
        filterDict(changes, (_, k) => !prevAttrs || !(k in prevAttrs)),
        (_, k, i) => {
            const valueLabel: FullAttr<LabelSpec> = mergeDiff(labelDefaults, {
                text: k,
                align: 'middle',
                radius: { value: 0 },
                angle: { value: 90 },
                rotate: false,
                color: { value: COLORS.white },
                size: { value: 12 },
            });
            const newNodeDefaults = createNodeDefaults(undefined, changes[k]!);
            return {
                ...newNodeDefaults,
                labels: { ...newNodeDefaults.labels, [VALUE_LABEL_ID]: valueLabel },
                pos: {
                    ...newNodeDefaults.pos,
                    value: initPos(numPrevNodes + i, (nodeDefaults.size.value[0] as number) * 2),
                },
            };
        }
    );

    return {
        ...mapDict(changes, (nodeChanges, k) => {
            return newNodes[k] ?? createNodeDefaults(prevAttrs?.[k], nodeChanges);
        }),
    };
};

export const evalNodeLabelChanges: EvalChangesFn<NodeSpec, NodeVar> = ({
    prevAttrs,
    prevExprs,
    changes,
    parentVars,
}) => {
    const labelDict = combineAttrs(
        nodeSpec.entries.labels,
        prevExprs.labels,
        changes.labels!,
        (prevLabelExprs, labelChanges, k, labelSpec) => {
            // calculate the 'r' variable based on the angle of the label and the size of the node
            const angleVar = evalAnimAttr(
                parentVars,
                prevLabelExprs?.angle ?? prevAttrs?.labels[k]?.angle,
                labelChanges?.angle
            );

            const nodeLabelVars: VarDict<NodeLabelVar> = {
                ...parentVars,
                r: {
                    attr: {
                        ...((angleVar.changed && angleVar.attr) ||
                            (parentVars.x.changed && parentVars.x.attr) ||
                            (parentVars.y.changed && parentVars.y.attr) ||
                            {}),
                        value: radiusAtAngle(
                            angleToRad(angleVar.attr.value),
                            parentVars.x.attr.value,
                            parentVars.y.attr.value,
                            prevAttrs?.shape ?? changes.shape!
                        ),
                    },
                    changed:
                        angleVar.changed ||
                        parentVars.x.changed ||
                        parentVars.y.changed ||
                        changes.shape !== undefined,
                },
            };
            return evalDeep(labelSpec, prevLabelExprs, labelChanges, nodeLabelVars);
        }
    );
    return { labels: isObjEmpty(labelDict) ? changes.labels : labelDict };
};

export const evalNodeChanges: EvalChangesFn<NodeSpec, CanvasVar> = ({
    prevAttrs,
    prevExprs,
    changes,
    selfRefOnly,
    parentVars,
}) => {
    // get node variables from attributes
    const nodeVars: VarDict<NodeVar> = {
        ...parentVars,
        x: evalAnimAttr(parentVars, prevExprs.size ?? prevAttrs?.size, changes.size, (v) => v[0]),
        y: evalAnimAttr(parentVars, prevExprs.size ?? prevAttrs?.size, changes.size, (v) => v[1]),
    };

    // evaluate child attributes
    return combineAttrs(
        nodeSpec,
        prevExprs,
        changes,
        (prevChildExprs, childChanges, childKey, childSpec) => {
            if (selfRefOnly) {
                // only evaluate self-referential attributes (e.g. size = '2x')
                if (
                    childKey === 'size' &&
                    changes.size?.value !== undefined &&
                    (usesVars(changes.size.value[0], ['x', 'y']) ||
                        usesVars(changes.size.value[1], ['x', 'y']))
                ) {
                    return evalDeep(childSpec, prevChildExprs, childChanges, nodeVars);
                }

                return childChanges;
            }

            if (childKey === 'labels') {
                return evalNodeLabelChanges({
                    prevAttrs,
                    prevExprs,
                    changes,
                    selfRefOnly,
                    parentVars: nodeVars,
                }).labels;
            }

            return evalDeep(childSpec, prevChildExprs, childChanges, nodeVars);
        }
    );
};
