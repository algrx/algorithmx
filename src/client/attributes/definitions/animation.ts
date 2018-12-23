import { AttrType, IAttrDefRecord, AttrDef, IAttrDef, IAttrDefLookup, IAttrDefArray } from '../definitions'
import { MapEndpoints, AttrEndpoint } from '../utils'
import { Attr, AttrRecord, AttrEntry } from '../types'
import * as attrUtils from '../utils'
import * as utils from '../../utils'

export enum AnimationType {
  Normal = 'normal',
  Scale = 'scale',
  Fade = 'fade',
  ScaleFade = 'scale-fade'
}

export enum AnimationEase {
  Linear = 'linear',
  Poly = 'poly', PolyIn = 'polyIn', PolyOut = 'polyOut', PolyInOut = 'polyInOut',
  Quad = 'quad', QuadIn = 'quadIn', QuadOut = 'quadOut', QuadInOut = 'quadInOut',
  Cubic = 'cubic', CubicIn = 'cubicIn', CubicOut = 'cubicOut', CubicInOut = 'cubicInOut',
  Sin = 'sin', SinIn = 'sinIn', SinOut = 'sinOut', SinInOut = 'sinInOut',
  Exp = 'exp', ExpIn = 'expIn', ExpOut = 'expOut', ExpInOut = 'expInOut',
  Circle = 'circle', CircleIn = 'circleIn', CircleOut = 'circleOut', CircleInOut = 'circleInOut',
  Elastic = 'elastic', ElasticIn = 'elasticIn', ElasticOut = 'elasticOut', ElasticInOut = 'elasticOut',
  Back = 'back', BackIn = 'backIn', BackOut = 'backOut', BackInOut = 'backInOut',
  Bounce = 'bounce', BounceIn = 'bounceIn', BounceOut = 'bounceOut', BounceInOut = 'bounceOut'
}

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
    type: { type: AttrType.String, validValues: utils.enumValues(AnimationType) },
    duration: { type: AttrType.Number },
    ease: { type: AttrType.String, validValues: utils.enumValues(AnimationEase) },
    linger: { type: AttrType.Number }
  },
  keyOrder: ['type', 'duration', 'ease', 'linger']
}

export const defaults: IAnimation = {
  type: AnimationType.Normal,
  duration: 400,
  ease: AnimationEase.Poly,
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
