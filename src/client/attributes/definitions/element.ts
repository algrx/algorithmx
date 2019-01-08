import { AttrType, AttrDef } from '../definitions'
import { AttrBool, AttrRecord, PartialAttr, AttrLookup, AttrString } from '../types'
import { AnimationFull } from './animation'

export interface IElementAttr extends AttrRecord {
  readonly visible: AttrBool
}
export const defaults: IElementAttr = {
  visible: true
}
export const definition: AttrDef<IElementAttr> = {
  type: AttrType.Record,
  entries: {
    visible: { type: AttrType.Boolean }
  },
  keyOrder: ['visible']
}
export const animationDefaults: PartialAttr<AnimationFull<IElementAttr>> = {
  visible: { type: 'fade' }
}

export interface ISvgMixinAttr extends AttrRecord {
  readonly svgattr: AttrLookup<AttrString>
}
export const svgMixinDefEntries: AttrDef<ISvgMixinAttr>['entries'] = {
  svgattr: { type: AttrType.Lookup, entry: { type: AttrType.String } }
}
export const svgMixinDefKeys: ReadonlyArray<keyof ISvgMixinAttr> = ['svgattr']
export const svgMixinDefaults: ISvgMixinAttr = {
  svgattr: {} as AttrLookup<AttrString>
}
