import {
    RecordSpec,
    BoolSpec,
    DictSpec,
    StringSpec,
    ExactStringSpec,
    AttrType,
    RecordEntries,
} from '../attr-spec';
import { withCommonSpec, WithCommonSpec, CommonSpec, commonDefaults, commonSpec } from './common';
import { FullAttr } from '../derived-attr';

export const visibleAnimTypes = <const>['fade', 'grow'];
export type VisibleAnimType = typeof visibleAnimTypes[number];

export type ElementSpec = RecordSpec<{
    readonly visible: RecordSpec<
        RecordEntries<WithCommonSpec<BoolSpec>> & {
            readonly animtype: ExactStringSpec<VisibleAnimType>;
        }
    >;
    readonly svgattrs: DictSpec<WithCommonSpec<StringSpec>>;
}>;
export const elementSpecEntries: RecordEntries<ElementSpec> = {
    visible: {
        type: AttrType.Record,
        entries: {
            ...commonSpec.entries,
            value: { type: AttrType.Boolean },
            animtype: {
                type: AttrType.String,
                validValues: visibleAnimTypes,
            },
        },
    },
    svgattrs: {
        type: AttrType.Dict,
        entry: withCommonSpec({ type: AttrType.String }),
    },
};

export const elementDefaults: FullAttr<ElementSpec> = {
    visible: {
        ...commonDefaults,
        value: true,
        animtype: 'fade',
    },
    svgattrs: {
        '*': { value: '', ...commonDefaults },
    },
};
