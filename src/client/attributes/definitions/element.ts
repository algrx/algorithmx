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

export interface ISvgCssAttr extends AttrRecord {
  readonly svgattr: AttrLookup<AttrString>
  readonly cssattr: AttrLookup<AttrString>
}
export const svgCssDefEntries: AttrDef<ISvgCssAttr>['entries'] = {
  svgattr: { type: AttrType.Lookup, entry: { type: AttrType.String } },
  cssattr: { type: AttrType.Lookup, entry: { type: AttrType.String } }
}
export const svgCssDefKeys: ReadonlyArray<keyof ISvgCssAttr> = ['svgattr', 'cssattr']
export const svgCssDefaults: ISvgCssAttr = {
  svgattr: {} as AttrLookup<AttrString>,
  cssattr: {} as AttrLookup<AttrString>
}
