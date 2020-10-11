import { AttrSpec, EntrySpec } from './spec';
import { PartialAttr, FullAttr } from './derived';
import { AnimSpec } from './components/animation';
import { combineAttrs } from './attr-utils';

interface ApplyDefaultsArgs<T extends AttrSpec> {
    readonly spec: T;
    readonly defaults: FullAttr<T>;
    readonly endpointDefaults: PartialAttr<AnimSpec>;
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
