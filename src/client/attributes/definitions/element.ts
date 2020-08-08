import {
    RecordAttrSpec,
    BoolAttrSpec,
    DictAttrSpec,
    StringAttrSpec,
    AttrType,
    AnyStringAttrSpec,
    createRecordAttrSpec,
    createDictAttrSpec,
} from '../types/attr-spec';
import { EvalAttr } from '../types/derived-attr';
import { AnimationFull } from './animation';

export type ElementAttrSpec = RecordAttrSpec<{
    readonly visible: BoolAttrSpec;
}>;
export const defaultElementAttr: EvalAttr<ElementAttrSpec> = {
    visible: true,
};
export const elementAttrSpec: ElementAttrSpec = createRecordAttrSpec({
    visible: { type: AttrType.Boolean },
});

export type SvgMixinAttrSpec = RecordAttrSpec<{
    readonly svgattr: DictAttrSpec<AnyStringAttrSpec>;
}>;
export const svgMixinAttrSpec: SvgMixinAttrSpec = createRecordAttrSpec({
    svgattr: createDictAttrSpec({ type: AttrType.String }),
});
//export const svgMixinDefKeys: ReadonlyArray<keyof ISvgMixinAttr> = ['svgattr'];
export const defaultSvgAttr: EvalAttr<SvgMixinAttrSpec> = {
    svgattr: {},
};
