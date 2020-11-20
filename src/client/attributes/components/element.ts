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

export type ElementSpec = RecordSpec<{
    readonly visible: WithAnimSpec<BoolSpec>;
    readonly svgattrs: DictSpec<WithAnimSpec<StringSpec>>;
    readonly remove: BoolSpec;
}>;
export const elementSpecEntries: RecordEntries<ElementSpec> = {
    visible: withAnimSpec({ type: AttrType.Boolean }),
    svgattrs: {
        type: AttrType.Dict,
        entry: withAnimSpec({ type: AttrType.String }),
    },
    remove: { type: AttrType.Boolean },
};

export const elementDefaults: FullAttr<ElementSpec> = {
    visible: { ...animDefaults, value: true },
    remove: false,
    svgattrs: {
        '*': { value: '', ...animDefaults },
    },
};
