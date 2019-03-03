import { AttrType } from '../definitions'
import { AttrNum, AttrString, AttrBool, PartialAttr } from '../types'
import { AnimationFull } from './animation'
import { COLORS } from '../../render/utils'
import { IElementAttr, ISvgMixinAttr } from './element'
import * as attrElement from './element'

import * as attrDef from '../definitions'
import * as math from '../../math'
import * as utils from '../../utils'

export enum EnumAlign {
  'top-left' = 'top-left',
  'top-middle' = 'top-middle',
  'top-right' = 'top-right',
  'middle-left' = 'middle-left',
  'middle' = 'middle',
  'middle-right' = 'middle-right',
  'bottom-left' = 'bottom-left',
  'bottom-middle' = 'bottom-middle',
  'bottom-right' = 'bottom-right',
  'radial' = 'radial'
}
export type Align = keyof typeof EnumAlign

export interface ILabelAttr extends IElementAttr, ISvgMixinAttr {
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

export const ALIGN_ANGLES: { [k in Align]: number } = {
  'top-left': Math.PI * 3 / 4,
  'top-middle': Math.PI * 1 / 2,
  'top-right': Math.PI * 1 / 4,
  'middle-left': Math.PI,
  'middle': Math.PI * 3 / 2,
  'middle-right': 0,
  'bottom-left': Math.PI * 5 / 4,
  'bottom-middle': Math.PI * 3 / 2,
  'bottom-right': Math.PI * 7 / 4,
  'radial': 0
}

export const definition = attrDef.extendRecordDef<ILabelAttr, IElementAttr>({
  entries: {
    text: { type: AttrType.String },
    align: { type: AttrType.String, validValues: utils.enumValues(EnumAlign) },
    pos: { type: AttrType.Record, entries: {
      x: { type: AttrType.Number },
      y: { type: AttrType.Number }
    }, keyOrder: ['x', 'y'] },
    radius: { type: AttrType.Number },
    angle: { type: AttrType.Number },
    rotate: { type: AttrType.Boolean },
    color: { type: AttrType.String },
    font: { type: AttrType.String },
    size: { type: AttrType.Number },
    ...attrElement.svgMixinDefEntries
  },
  type: AttrType.Record,
  keyOrder: ['text', 'align', 'pos', 'radius', 'angle', 'rotate', 'align', 'color', 'font', 'size',
    ...attrElement.svgMixinDefKeys]
}, attrElement.definition)

export const defaults: ILabelAttr = {
  ...attrElement.defaults,
  text: '',
  align: 'bottom-middle',
  pos: { x: 0, y: 0 },
  radius: 0,
  angle: 90,
  rotate: false,
  color: COLORS.gray,
  font: 'Arial, Helvetica, sans-serif',
  size: 12,
  ...attrElement.svgMixinDefaults
}

export const animationDefaults: PartialAttr<AnimationFull<ILabelAttr>> = {
  ...attrElement.animationDefaults
}

export const alignFromAngle = (angle: number, rotate: boolean): Align => {
  if (rotate) return math.restrictAngle(angle) < Math.PI ? 'bottom-middle' : 'top-middle'

  const testAngle = math.restrictAngle(angle + Math.PI)
  const radialAligns = Object.keys(ALIGN_ANGLES)
    .filter((v: Align) => v !== 'middle' && v !== 'radial')
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
