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
} from '../attr-spec';
import { FullAttr, PartialAttr } from '../derived-attr';
import {
    WithCommonSpec,
    withCommonSpec,
    commonDefaults,
    CommonSpec,
    applyDefaults,
} from './common';
import { ElementSpec, elementSpecEntries, elementDefaults } from './element';
import { CanvasVar, NodeVar, NodeLabelVar, nodeVars, nodeLabelVars } from './expression';
import { LabelSpec, labelSpec, labelDefaults, createLabelDictDefaults } from './label';
import { COLORS } from './color';
import { mapDict, filterDict, mergeDiff } from '../../utils';
import { combineAttrs, mapAttr } from '../attr-utils';
import { VarDict, evalAttr, evalDeep, usesVars } from '../expr-utils';
import { angleToRad, radiusAtAngleRect, angleToDeg } from '../../math';

export const nodeShape = <const>['circle', 'rect', 'ellipse'];
export type NodeShape = typeof nodeShape[number];

export type NodeSpec = RecordSpec<
    {
        readonly labels: DictSpec<LabelSpec>;
        readonly shape: ExactStringSpec<NodeShape>;
        readonly color: WithCommonSpec<StringSpec>;
        readonly size: WithCommonSpec<TupleSpec<NumSpec>>;
        readonly pos: WithCommonSpec<TupleSpec<NumSpec>>;
        readonly fixed: WithCommonSpec<BoolSpec>;
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
        color: withCommonSpec({ type: AttrType.String }),
        size: withCommonSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        pos: withCommonSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        fixed: withCommonSpec({ type: AttrType.Boolean }),
        draggable: { type: AttrType.Boolean },
        listenclick: { type: AttrType.Boolean },
        listenhover: { type: AttrType.Boolean },
        ...elementSpecEntries,
    },
    validVars: nodeVars,
};

export const VALUE_LABEL_ID = 'value';

const nodeDefaults: FullAttr<NodeSpec> = {
    labels: {},
    shape: 'circle',
    color: { ...commonDefaults, value: COLORS.darkgray },
    size: { ...commonDefaults, value: [12, 12] },
    pos: { ...commonDefaults, value: [0, 0] },
    fixed: { ...commonDefaults, value: false },
    draggable: false,
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
    attrs: FullAttr<NodeSpec> | undefined,
    changes: PartialAttr<NodeSpec>
): FullAttr<NodeSpec> => {
    if (!changes.labels) return nodeDefaults;

    const labelDictDefaults = createLabelDictDefaults(attrs?.labels, changes.labels!);

    // new labels with any key other than 'value' should be positioned
    // radially around the node by default
    const prevLabelKeys = Object.keys(attrs?.labels ?? {});
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
                text: { value: name },
                radius: { value: { m: 1, x: 'r', c: 3 } },
                angle: { value: angleToDeg(labelAngle) },
                align: { value: 'radial' },
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
    attrs: FullAttr<DictSpec<NodeSpec>> | undefined,
    changes: PartialAttr<DictSpec<NodeSpec>>
): FullAttr<DictSpec<NodeSpec>> => {
    const numPrevNodes = Object.keys(attrs ?? {}).length;
    const newNodes = mapDict(
        filterDict(changes, (_, k) => !attrs || !(k in attrs)),
        (_, k, i) => {
            const valueLabel: FullAttr<LabelSpec> = mergeDiff(labelDefaults, {
                text: { value: name },
                align: { value: 'middle' },
                radius: { value: 0 },
                angle: { value: 90 },
                rotate: { value: false },
                color: { value: COLORS.white },
                size: { value: 12 },
            });
            return {
                ...createNodeDefaults(undefined, changes[k]!),
                labels: { [VALUE_LABEL_ID]: valueLabel },
                pos: {
                    ...nodeDefaults.pos,
                    value: initPos(numPrevNodes + i, (nodeDefaults.size.value[0] as number) * 2),
                },
            };
        }
    );

    return {
        '*': nodeDefaults,
        ...mapDict(changes, (nodeChanges, k) => {
            return newNodes[k] ?? createNodeDefaults(attrs?.[k], nodeChanges);
        }),
    };
};

export const evalNodeLabels = (
    attrs: FullAttr<NodeSpec> | undefined,
    changes: PartialAttr<NodeSpec>,
    nodeVars: VarDict<NodeVar>
): PartialAttr<DictSpec<LabelSpec>> => {
    return combineAttrs(
        nodeSpec.entries.labels,
        attrs?.labels,
        changes.labels!,
        (labelAttr, labelChanges, _, labelSpec) => {
            // calculate the 'r' variable based on the angle of the label and the size of the node
            const labelAngle = evalAttr(
                labelAttr?.angle?.value,
                labelChanges?.angle?.value,
                nodeVars
            );

            const nodeLabelVars: VarDict<NodeLabelVar> = {
                ...nodeVars,
                r: {
                    value: radiusAtAngle(
                        angleToRad(labelAngle.value),
                        nodeVars.x.value,
                        nodeVars.y.value,
                        attrs?.shape ?? changes.shape!
                    ),
                    changed:
                        labelAngle.changed ||
                        nodeVars.x.changed ||
                        nodeVars.y.changed ||
                        changes.shape !== undefined,
                },
            };
            return evalDeep(labelSpec, labelAttr, labelChanges, nodeVars);
        }
    );
};

export const evalNode = (
    attrs: FullAttr<NodeSpec> | undefined,
    changes: PartialAttr<NodeSpec>,
    canvasVars: VarDict<CanvasVar>,
    selfRefOnly: boolean
): PartialAttr<NodeSpec> => {
    // get node variables from attributes
    const nodeVars: VarDict<NodeVar> = {
        ...canvasVars,
        x: evalAttr(attrs?.pos.value[0], changes.pos?.value?.[0], canvasVars),
        y: evalAttr(attrs?.pos.value[1], changes.pos?.value?.[1], canvasVars),
    };

    // evaluate child attributes
    return combineAttrs(
        nodeSpec,
        attrs,
        changes,
        (childAttr, childChanges, childKey, childSpec) => {
            if (selfRefOnly) {
                // only evaluate self-referential attributes (e.g. size = '2x')
                if (
                    childKey === 'size' &&
                    changes.size!.value &&
                    (usesVars(changes.size!.value[0], ['x', 'y']) ||
                        usesVars(changes.size!.value[1], ['x', 'y']))
                ) {
                    return evalDeep(childSpec, childAttr, childChanges, nodeVars);
                }

                return childChanges;
            }

            if (childKey === 'labels') {
                return evalNodeLabels(attrs, changes, nodeVars);
            }

            return evalDeep(childSpec, childAttr, childChanges, nodeVars);
        }
    );
};
