import { AttrType, AttrDef } from '../definitions'
import { AttrBool, AttrLookup, AttrString, AttrRecord, PartialAttr } from '../types'
import { AnimationFull, AnimationType } from './animation'

export interface ICommonAttr extends AttrRecord {
  readonly visible: AttrBool
  readonly svg: AttrLookup<AttrString>
  readonly css: AttrLookup<AttrString>
}

export const defaults: ICommonAttr = {
  visible: true,
  svg: {} as AttrLookup<AttrString>,
  css: {} as AttrLookup<AttrString>
}

export const definition: AttrDef<ICommonAttr> = {
  type: AttrType.Record,
  entries: {
    visible: { type: AttrType.Boolean },
    svg: { type: AttrType.Lookup, entry: { type: AttrType.String } },
    css: { type: AttrType.Lookup, entry: { type: AttrType.String } }
  },
  keyOrder: ['visible', 'svg', 'css']
}

export const animationDefaults: PartialAttr<AnimationFull<ICommonAttr>> = {
  visible: { type: AnimationType.Fade }
}
