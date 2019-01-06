import { AttrType, IAttrDefRecord, AttrDef, IAttrDef, IAttrDefLookup, IAttrDefArray } from '../definitions'
import { MapEndpoints, AttrEndpoint } from '../utils'
import { Attr, AttrRecord, AttrEntry } from '../types'
import * as attrUtils from '../utils'
import * as utils from '../../utils'

export enum EnumAnimationType {
  normal = 'normal',
  scale = 'scale',
  fade = 'fade',
  'scale-fade' = 'scale-fade',
  traverse = 'traverse',
  'traverse-reverse' = 'traverse-reverse'
}
export type AnimationType = keyof typeof EnumAnimationType

export enum EnumAnimationEase {
  linear = 'linear',
  poly = 'poly', 'poly-in' = 'poly-in', 'poly-out' = 'poly-out', 'poly-in-out' = 'poly-in-out',
  quad = 'quad', 'quad-in' = 'quad-in', 'quad-out' = 'quad-out', 'quad-in-out' = 'quad-in-out',
  cubic = 'cubic', 'cubic-in' = 'cubic-in', 'cubic-out' = 'cubic-out', 'cubic-in-out' = 'cubic-in-out',
  sin = 'sin', 'sin-in' = 'sin-in', 'sin-out' = 'sin-out', 'sin-in-out' = 'sin-in-out',
  exp = 'exp', 'exp-in' = 'exp-in', 'exp-out' = 'exp-out', 'exp-in-out' = 'exp-in-out',
  circle = 'circle', 'circle-in' = 'Circle-out', 'circle-out' = 'circle-out', 'circle-in-out' = 'circle-in-out',
  elastic = 'elastic', 'elastic-in' = 'elastic-in', 'elastic-out' = 'elastic-out', 'elastic-in-out' = 'elastic-in-out',
  back = 'back', 'back-in' = 'back-in', 'back-out' = 'back-out', 'back-in-out' = 'back-in-out',
  bounce = 'bounce', 'bounce-in' = 'bounce-in', 'bounce-out' = 'bounce-out', 'bounce-in-out' = 'bounce-in-out'
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
