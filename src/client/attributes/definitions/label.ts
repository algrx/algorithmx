import { AttrType } from '../definitions'
import { AttrNum, AttrString, AttrBool, PartialAttr } from '../types'
import { AnimationFull } from './animation'
import { ICommonAttr } from './common'
import * as attrAnim from './animation'
import * as attrCommon from './common'
import * as attrDef from '../definitions'
import * as attrUtils from '../utils'
import * as math from '../../math'
import * as utils from '../../utils'

export interface ILabelAttr extends ICommonAttr {
  readonly text: AttrString
  readonly align: AttrString & Align
  readonly pos: {
    readonly x: AttrNum
    readonly y: AttrNum
  }
  readonly radius: AttrNum
  readonly angle: AttrNum
  readonly rotate: AttrBool
  readonly color: AttrString
  readonly font: AttrString
  readonly size: AttrNum
}

export enum Align {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  CenterLeft = 'center-left',
  Center = 'center',
  CenterRight = 'center-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right',
  Radial = 'radial'
}

export const ALIGN_ANGLES: { [k in Align]: number } = {
  [Align.TopLeft]: Math.PI * 3 / 4,
  [Align.TopCenter]: Math.PI * 1 / 2,
  [Align.TopRight]: Math.PI * 1 / 4,
  [Align.CenterLeft]: Math.PI,
  [Align.Center]: Math.PI * 3 / 2,
  [Align.CenterRight]: 0,
  [Align.BottomLeft]: Math.PI * 5 / 4,
  [Align.BottomCenter]: Math.PI * 3 / 2,
  [Align.BottomRight]: Math.PI * 7 / 4,
  [Align.Radial]: 0
}

export const definition = attrDef.extendRecordDef<ILabelAttr, ICommonAttr>({
  entries: {
    text: { type: AttrType.String },
    align: { type: AttrType.String, validValues: utils.enumValues(Align) },
    pos: { type: AttrType.Record, entries: {
      x: { type: AttrType.Number },
      y: { type: AttrType.Number }
    }, keyOrder: ['x', 'y'] },
    radius: { type: AttrType.Number },
    angle: { type: AttrType.Number },
    rotate: { type: AttrType.Boolean },
    color: { type: AttrType.String },
    font: { type: AttrType.String },
    size: { type: AttrType.Number }
  },
  type: AttrType.Record,
  keyOrder: ['text', 'align', 'pos', 'radius', 'angle', 'rotate', 'align', 'color', 'font', 'size']
}, attrCommon.definition)

export const defaults: ILabelAttr = {
  ...attrCommon.defaults,
  text: '',
  align: Align.BottomCenter,
  pos: { x: 0, y: 0 },
  radius: 0,
  angle: 90,
  rotate: false,
  color: '#808080',
  font: 'Arial, Helvetica, sans-serif',
  size: 12
}

export const animationDefaults: PartialAttr<AnimationFull<ILabelAttr>> = {
  ...attrCommon.animationDefaults
}

export const alignFromAngle = (angle: number, rotate: boolean): Align => {
  if (rotate) return math.restrictAngle(angle) < Math.PI ? Align.BottomCenter : Align.TopCenter

  const testAngle = math.restrictAngle(angle + Math.PI)
  const radialAligns = Object.keys(ALIGN_ANGLES)
    .filter(v => v !== Align.Center && v !== Align.Radial)
    .sort((a, b) => ALIGN_ANGLES[a] < ALIGN_ANGLES[b] ? -1 : 0) as ReadonlyArray<Align>

  return radialAligns.find((align, i) => {
    const prevAngle = (i === 0) ? -ALIGN_ANGLES[radialAligns[1]] : ALIGN_ANGLES[radialAligns[i - 1]]
    const curAngle = ALIGN_ANGLES[radialAligns[i]]
    const nextAngle = (i === radialAligns.length - 1) ? Math.PI * 2 : ALIGN_ANGLES[radialAligns[i + 1]]

    return testAngle > (prevAngle + curAngle) / 2 && testAngle <= (curAngle + nextAngle) / 2
  })
}

export const init = (name: string): ILabelAttr => {
  return {...defaults, text: name }
}
