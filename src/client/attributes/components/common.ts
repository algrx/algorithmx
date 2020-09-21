import { PartialAttr } from '../derived-attr';
import {
    AttrType,
    Entries,
    BoolSpec,
    EndpointValueSpec,
    RecordSpecType,
    EndpointSpec,
    RecordSpec,
    AttrSpec,
    EntrySpec,
} from '../attr-spec';
import { AnimSpec, animSpecEntries, defaultAnim, AnimType } from './animation';
import { FullAttr } from '../derived-attr';
import { mapAttr, combineAttrs } from '../attr-utils';

export type CommonSpec = RecordSpec<
    {
        readonly highlight: BoolSpec;
    } & Entries<AnimSpec>
>;

export const commonSpec: CommonSpec = {
    type: AttrType.Record,
    entries: {
        ...animSpecEntries,
        highlight: { type: AttrType.Boolean },
    },
};

export const commonDefaults: FullAttr<CommonSpec> = {
    ...defaultAnim,
    highlight: false,
};

export type WithCommonSpec<T extends EndpointValueSpec> = EndpointSpec<T, Entries<CommonSpec>>;

export const withCommonSpec = <T extends EndpointValueSpec>(valueSpec: T): WithCommonSpec<T> => {
    return {
        type: AttrType.Record,
        entries: {
            value: valueSpec,
            ...commonSpec.entries,
        },
    };
};

interface ApplyDefaultsArgs<T extends AttrSpec> {
    readonly spec: T;
    readonly defaults: FullAttr<T>;
    readonly endpointDefaults: PartialAttr<CommonSpec>;
    readonly changes: PartialAttr<T>;
    readonly applyAll: boolean; // if false, the defaults will only be applied to the endpoints of the changes
}
export const applyDefaults = <T extends AttrSpec>(args: ApplyDefaultsArgs<T>): PartialAttr<T> => {
    return combineAttrs(
        args.spec,
        args.defaults as PartialAttr<T>,
        args.changes,
        (childDefaults, childChanges, _, childSpec) => {
            if (childChanges)
                return applyDefaults({
                    ...args,
                    spec: childSpec,
                    defaults: childDefaults as FullAttr<EntrySpec<T>>,
                    changes: childChanges,
                });
            else return undefined;
        }
    );
};
