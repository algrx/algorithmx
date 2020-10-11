import {
    RecordSpec,
    BoolSpec,
    DictSpec,
    StringSpec,
    ExactStringSpec,
    AttrType,
    RecordEntries,
} from '../spec';
import { WithAnimSpec, withAnimSpec, animDefaults, animSpec } from './animation';
import { FullAttr } from '../derived';

export const visibleAnimTypes = <const>['fade', 'grow'];
export type VisibleAnimType = typeof visibleAnimTypes[number];

export type ElementSpec = RecordSpec<{
    readonly visible: RecordSpec<
        RecordEntries<WithAnimSpec<BoolSpec>> & {
            readonly animtype: ExactStringSpec<VisibleAnimType>;
        }
    >;
    readonly svgattrs: DictSpec<WithAnimSpec<StringSpec>>;
    readonly remove: BoolSpec;
}>;
export const elementSpecEntries: RecordEntries<ElementSpec> = {
    visible: {
        type: AttrType.Record,
        entries: {
            ...animSpec.entries,
            value: { type: AttrType.Boolean },
            animtype: {
                type: AttrType.String,
                validValues: visibleAnimTypes,
            },
        },
    },
    svgattrs: {
        type: AttrType.Dict,
        entry: withAnimSpec({ type: AttrType.String }),
    },
    remove: { type: AttrType.Boolean },
};

export const elementDefaults: FullAttr<ElementSpec> = {
    visible: {
        ...animDefaults,
        value: true,
        animtype: 'fade',
    },
    remove: false,
    svgattrs: {
        '*': { value: '', ...animDefaults },
    },
};
