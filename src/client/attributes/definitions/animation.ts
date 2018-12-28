import { AttrType, IAttrDefRecord, AttrDef, IAttrDef, IAttrDefLookup, IAttrDefArray } from '../definitions'
import { MapEndpoints, AttrEndpoint } from '../utils'
import { Attr, AttrRecord, AttrEntry } from '../types'
import * as attrUtils from '../utils'
import * as utils from '../../utils'

export enum EnumAnimationType {
  normal = 'normal',
  scale = 'scale',
  fade = 'fade',
  'scale-fade' = 'scale-fade'
}
export type AnimationType = keyof typeof EnumAnimationType

export enum EnumAnimationEase {
  linear = 'linear',
  poly = 'poly', polyIn = 'polyIn', polyOut = 'polyOut', polyInOut = 'polyInOut',
  quad = 'quad', quadIn = 'quadIn', quadOut = 'quadOut', quadInOut = 'quadInOut',
  cubic = 'cubic', cubicIn = 'cubicIn', cubicOut = 'cubicOut', cubicInOut = 'cubicInOut',
  sin = 'sin', sinIn = 'sinIn', sinOut = 'sinOut', sinInOut = 'sinInOut',
  exp = 'exp', expIn = 'expIn', expOut = 'expOut', expInOut = 'expInOut',
  circle = 'circle', circleIn = 'CircleOut', circleOut = 'circleOut', circleInOut = 'circleInOut',
  elastic = 'elastic', elasticIn = 'elasticIn', elasticOut = 'elasticOut', elasticInOut = 'elasticInOut',
  back = 'back', backIn = 'backIn', backOut = 'backOut', backInOut = 'backInOut',
  bounce = 'bounce', bounceIn = 'bounceIn', bounceOut = 'bounceOut', bounceInOut = 'bounceInOut'
}
export type AnimationEase = keyof typeof EnumAnimationEase

export interface IAnimation extends AttrRecord {
  readonly type: AnimationType
  readonly duration: number
  readonly ease: AnimationEase
  readonly linger: number
}

export type AnimationFull<T extends Attr> = attrUtils.MapEndpoints<T, IAnimation>

export const definition: IAttrDefRecord<IAnimation> = {
  type: AttrType.Record,
  entries: {
    type: { type: AttrType.String, validValues: utils.enumValues(EnumAnimationType) },
    duration: { type: AttrType.Number },
    ease: { type: AttrType.String, validValues: utils.enumValues(EnumAnimationEase) },
    linger: { type: AttrType.Number }
  },
  keyOrder: ['type', 'duration', 'ease', 'linger']
}

export const defaults: IAnimation = {
  type: 'normal',
  duration: 350,
  ease: 'poly',
  linger: 1000
}

export const createFullDef = <T extends Attr, A extends Attr>(bodyDef: AttrDef<T>, endDef: AttrDef<A>):
                                                              AttrDef<MapEndpoints<T, A>> => {
  if (attrUtils.isDefLookup(bodyDef)) {
    const defLookup: IAttrDefLookup<MapEndpoints<T, A>> = {
      type: AttrType.Lookup,
      entry: createFullDef((bodyDef as unknown as IAttrDefLookup<T>).entry, endDef)
    }
    return defLookup as unknown as AttrDef<MapEndpoints<T, A>>

  } else if (attrUtils.isDefArray(bodyDef)) {
    const defArray: IAttrDefArray<MapEndpoints<T, A>> = {
      type: AttrType.Array,
      entry: createFullDef((bodyDef as unknown as IAttrDefArray<T>).entry, endDef)
    }
    return defArray as unknown as AttrDef<MapEndpoints<T, A>>

  } else if (attrUtils.isDefRecord(bodyDef)) {
    const entries = (bodyDef as IAttrDefRecord<T>).entries
    const defRecord: IAttrDefRecord<MapEndpoints<T, A>> = {
      type: AttrType.Record,
      entries: utils.mapDict(entries, (k, v) =>
        createFullDef(v, endDef)) as unknown as IAttrDefRecord<MapEndpoints<T, A>>['entries'],
      keyOrder: Object.keys(entries) as unknown as IAttrDefRecord<MapEndpoints<T, A>>['keyOrder']
    }
    return defRecord as AttrDef<MapEndpoints<T, A>>

  } else return endDef as AttrDef<MapEndpoints<T, A>>
}
