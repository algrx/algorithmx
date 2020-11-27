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
} from '../spec';
import { PartialAttr, FullAttr } from '../derived';
import { WithAnimSpec, withAnimSpec, animDefaults } from './animation';
import { ElementSpec, elementSpecEntries, elementDefaults } from './element';
import { COLORS } from './color';
import { combineAttrs, mapAttr } from '../utils';
import { mapDict, filterDict } from '../../utils';
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
        readonly text: StringSpec;
        readonly align: ExactStringSpec<LabelAlign>;
        readonly pos: WithAnimSpec<TupleSpec<NumSpec>>;
        readonly radius: WithAnimSpec<NumSpec>;
        readonly angle: WithAnimSpec<NumSpec>;
        readonly rotate: BoolSpec;
        readonly color: WithAnimSpec<StringSpec>;
        readonly font: StringSpec;
        readonly size: WithAnimSpec<NumSpec>;
    } & RecordEntries<ElementSpec>
>;

export const labelSpec: LabelSpec = {
    type: AttrType.Record,
    entries: {
        text: { type: AttrType.String },
        align: { type: AttrType.String, validValues: labelAlign },
        pos: withAnimSpec({ type: AttrType.Tuple, entry: { type: AttrType.Number } }),
        radius: withAnimSpec({ type: AttrType.Number }),
        angle: withAnimSpec({ type: AttrType.Number }),
        rotate: { type: AttrType.Boolean },
        color: withAnimSpec({ type: AttrType.String }),
        font: { type: AttrType.String },
        size: withAnimSpec({ type: AttrType.Number }),
        ...elementSpecEntries,
    },
};

export const labelDefaults: FullAttr<LabelSpec> = {
    text: '',
    align: 'bottom-middle',
    pos: { ...animDefaults, value: [0, 0] },
    radius: { ...animDefaults, value: 0 },
    angle: { ...animDefaults, value: 90 },
    rotate: false,
    color: { ...animDefaults, value: COLORS.gray },
    font: 'Arial, Helvetica, sans-serif',
    size: { ...animDefaults, value: 12 },
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
