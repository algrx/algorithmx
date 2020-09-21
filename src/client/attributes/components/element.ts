import {
    RecordSpec,
    BoolSpec,
    DictSpec,
    StringSpec,
    AttrType,
    AnyStringSpec,
    Entries,
    EndpointSpec,
} from '../attr-spec';
import { withCommonSpec, WithCommonSpec, CommonSpec, commonDefaults, commonSpec } from './common';
import { AnimType, animTypes } from './animation';
import { FullAttr } from '../derived-attr';

export type ElementSpec = RecordSpec<{
    readonly visible: EndpointSpec<
        BoolSpec,
        Omit<Entries<CommonSpec>, 'animType' | 'highlight' | 'linger'> & {
            readonly animType: StringSpec<AnimType | 'fade' | 'grow'>;
        }
    >;
}>;
export const elementSpecEntries: Entries<ElementSpec> = {
    visible: {
        type: AttrType.Record,
        entries: {
            ...commonSpec.entries,
            value: { type: AttrType.Boolean },
            animType: {
                type: AttrType.String,
                validValues: [...animTypes, 'fade', 'grow'],
            },
        },
    },
};

export const elementDefaults: FullAttr<ElementSpec> = {
    visible: {
        value: true,
        animType: 'fade',
        ease: commonDefaults.ease,
        duration: commonDefaults.duration,
    },
};

export type SvgSpec = RecordSpec<{
    readonly svgattr: DictSpec<WithCommonSpec<AnyStringSpec>>;
}>;
export const svgSpecEntries: Entries<SvgSpec> = {
    svgattr: {
        type: AttrType.Dict,
        entry: withCommonSpec({ type: AttrType.String }),
    },
};
export const svgDefaults: FullAttr<SvgSpec> = {
    svgattr: {
        '*': { value: '', ...commonDefaults },
    },
};
