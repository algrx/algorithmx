import { PartialAttr } from '../derived-attr';
import {
    AttrType,
    RecordSpec,
    BoolSpec,
    NumSpec,
    StringSpec,
    ExactStringSpec,
    TupleSpec,
    RecordEntries,
    DictSpec,
} from '../attr-spec';
import { FullAttr } from '../derived-attr';
import {
    withCommonSpec,
    CommonSpec,
    commonDefaults,
    WithCommonSpec,
    applyDefaults,
} from './common';
import { ElementSpec, elementSpecEntries, elementDefaults } from './element';
import { COLORS } from './color';
import { mapDict, filterDict } from '../../utils';
import { combineAttrs, mapAttr } from '../attr-utils';
import { restrictAngle } from '../../math';

const labelAlign = <const>[
    'top-left',
    'top-middle',
    'top-right',
    'middle-left',
    'middle',
    'middle-right',
    'bottom-left',
    'bottom-middle',
    'bottom-right',
    'radial',
];
export type LabelAlign = typeof labelAlign[number];

export type LabelSpec = RecordSpec<
    {
        readonly text: WithCommonSpec<StringSpec>;
        readonly align: WithCommonSpec<ExactStringSpec<LabelAlign>>;
        readonly pos: WithCommonSpec<TupleSpec<NumSpec>>;
        readonly radius: WithCommonSpec<NumSpec>;
        readonly angle: WithCommonSpec<NumSpec>;
        readonly rotate: WithCommonSpec<BoolSpec>;
        readonly color: WithCommonSpec<StringSpec>;
        readonly font: WithCommonSpec<StringSpec>;
        readonly size: WithCommonSpec<NumSpec>;
    } & RecordEntries<ElementSpec>
>;

export const labelSpec: LabelSpec = {
    type: AttrType.Record,
    entries: {
        text: withCommonSpec({ type: AttrType.String }),
        align: withCommonSpec({ type: AttrType.String, validValues: labelAlign }),
        pos: withCommonSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        radius: withCommonSpec({ type: AttrType.Number }),
        angle: withCommonSpec({ type: AttrType.Number }),
        rotate: withCommonSpec({ type: AttrType.Boolean }),
        color: withCommonSpec({ type: AttrType.String }),
        font: withCommonSpec({ type: AttrType.String }),
        size: withCommonSpec({ type: AttrType.Number }),
        ...elementSpecEntries,
    },
};

export const labelDefaults: FullAttr<LabelSpec> = {
    text: { ...commonDefaults, value: '' },
    align: { ...commonDefaults, value: 'bottom-middle' },
    pos: { ...commonDefaults, value: [0, 0] },
    radius: { ...commonDefaults, value: 0 },
    angle: { ...commonDefaults, value: 90 },
    rotate: { ...commonDefaults, value: false },
    color: { ...commonDefaults, value: COLORS.gray },
    font: { ...commonDefaults, value: 'Arial, Helvetica, sans-serif' },
    size: { ...commonDefaults, value: 12 },
    ...elementDefaults,
};

export const ALIGN_ANGLES: { readonly [k in LabelAlign]: number } = {
    'top-left': (Math.PI * 3) / 4,
    'top-middle': (Math.PI * 1) / 2,
    'top-right': (Math.PI * 1) / 4,
    'middle-left': Math.PI,
    middle: (Math.PI * 3) / 2,
    'middle-right': 0,
    'bottom-left': (Math.PI * 5) / 4,
    'bottom-middle': (Math.PI * 3) / 2,
    'bottom-right': (Math.PI * 7) / 4,
    radial: 0, // automatically align based on current angle
};

export const alignFromAngle = (angle: number, rotate: boolean): LabelAlign => {
    if (rotate) return restrictAngle(angle) < Math.PI ? 'bottom-middle' : 'top-middle';

    const testAngle = restrictAngle(angle + Math.PI);
    const radialAligns = (Object.keys(ALIGN_ANGLES) as ReadonlyArray<LabelAlign>)
        .filter((v) => v !== 'middle' && v !== 'radial')
        .sort((a, b) => (ALIGN_ANGLES[a] < ALIGN_ANGLES[b] ? -1 : 0));

    return (
        radialAligns.find((align, i) => {
            const prevAngle =
                i === 0 ? -ALIGN_ANGLES[radialAligns[1]] : ALIGN_ANGLES[radialAligns[i - 1]];
            const curAngle = ALIGN_ANGLES[radialAligns[i]];
            const nextAngle =
                i === radialAligns.length - 1 ? Math.PI * 2 : ALIGN_ANGLES[radialAligns[i + 1]];

            return (
                testAngle > (prevAngle + curAngle) / 2 && testAngle <= (curAngle + nextAngle) / 2
            );
        }) ?? 'middle'
    );
};

export const createLabelDictDefaults = (
    prevAttr: FullAttr<DictSpec<LabelSpec>> | undefined,
    changes: PartialAttr<DictSpec<LabelSpec>>
): FullAttr<DictSpec<LabelSpec>> => {
    const newLabels = mapDict(
        filterDict(changes, (_, k) => !prevAttr || !(k in prevAttr)),
        (_, k) => ({
            ...labelDefaults,
            text: k, // label text defaults to label id
        })
    );

    return {
        '*': labelDefaults,
        ...newLabels,
    };
};
