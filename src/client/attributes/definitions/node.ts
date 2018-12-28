import { PartialAttr, AttrLookup, AttrString, AttrNum, EnumVarSymbol, AttrEvalPartial } from '../types'
import { AnimationFull } from './animation'
import { ICommonAttr } from './common'
import { ILabelAttr } from './label'
import { AttrType } from '../definitions'
import { COLORS } from '../../render/utils'
import * as attrLabel from './label'
import * as attrCommon from './common'
import * as attrDef from '../definitions'
import * as attrUtils from '../utils'
import * as attrExpr from '../expressions'
import * as math from '../../math'
import * as utils from '../../utils'

export interface INodeAttr extends ICommonAttr {
  readonly labels: AttrLookup<ILabelAttr>
  readonly shape: Shape
  readonly corners: AttrNum
  readonly color: AttrString
  readonly size: {
    readonly width: AttrNum
    readonly height: AttrNum
  }
  readonly pos: {
    readonly x: AttrNum
    readonly y: AttrNum
  }
  readonly fixed: boolean
  readonly draggable: boolean
  readonly hover: boolean
  readonly click: boolean
}

export enum Shape {
  circle = 'circle',
  rect = 'rect',
  ellipse = 'ellipse'
}
export type ShapeValue = keyof typeof Shape

export const VALUE_LABEL = 'value'

export const defaults: INodeAttr = {
  ...attrCommon.defaults,
  labels: {} as AttrLookup<ILabelAttr>,
  shape: Shape.circle,
  corners: 4,
  color: COLORS.gray,
  size: {
    width: 12,
    height: 12
  },
  pos: { x: 0, y: 0 },
  fixed: false,
  draggable: true,
  hover: false,
  click: false
}

export const definition = attrDef.extendRecordDef<INodeAttr, ICommonAttr>({
  entries: {
    labels: {
      type: AttrType.Lookup,
      entry: attrLabel.definition,
      validVars: [EnumVarSymbol.Radius]
    },
    shape: { type: AttrType.String, validValues: utils.enumValues(Shape) },
    corners: { type: AttrType.Number },
    color: { type: AttrType.String },
    size: { type: AttrType.Record, entries: {
      width: { type: AttrType.Number, symbol: EnumVarSymbol.Width },
      height: { type: AttrType.Number, symbol: EnumVarSymbol.Height }
    }, keyOrder: ['width', 'height'] },
    pos: { type: AttrType.Record, entries: {
      x: { type: AttrType.Number },
      y: { type: AttrType.Number }
    }, keyOrder: ['x', 'y'] },
    fixed: { type: AttrType.Boolean },
    draggable: { type: AttrType.Boolean },
    hover: { type: AttrType.Boolean },
    click: { type: AttrType.Boolean }
  },
  type: AttrType.Record,
  keyOrder: ['labels', 'shape', 'color', 'size', 'corners', 'pos', 'fixed', 'draggable', 'hover', 'click'],
  validVars: [EnumVarSymbol.Width, EnumVarSymbol.Height]
}, attrCommon.definition)

export const animationDefaults: PartialAttr<AnimationFull<INodeAttr>> = {
  ...attrCommon.animationDefaults,
  labels: { '*': attrLabel.animationDefaults }
}

export const radiusAtAngle = (angle: number, rx: number, ry: number, shape: Shape): number => {
  if (shape === 'rect' || shape === 'ellipse') return math.radiusAtAngleRect(angle, rx, ry)
  else return rx
}

export const init = (name: string, index: number): INodeAttr => {
  const defaultLabel: ILabelAttr = {
    ...attrLabel.init(name),
    align: 'middle',
    pos: { x: 0, y: -1 },
    radius: 0,
    angle: 90,
    rotate: true,
    color: 'rgb(220,220,220)',
    size: 13
  }
  return {...defaults,
    labels: { [VALUE_LABEL]: defaultLabel } as unknown as AttrLookup<ILabelAttr>,
    pos: initPos(index, defaults.size.width as number * 2)
  }
}

export const initChildren = (prevAttr: INodeAttr, changes: PartialAttr<INodeAttr>): PartialAttr<INodeAttr> => {
  const newLabels = attrUtils.newLookupEntries(prevAttr.labels, changes.labels)

  const prevRadialLabels = utils.filterDict(prevAttr.labels, k => k !== VALUE_LABEL)
  const newRadialLabelChanges = utils.filterDict(newLabels, k => k !== VALUE_LABEL)
  const newOtherLabelChanges = utils.filterDict(newLabels, k => newRadialLabelChanges[k] === undefined)

  const newRadialLabels = utils.mapDict(newRadialLabelChanges, (k, v, i): PartialAttr<ILabelAttr> => {
    const index = Object.keys(prevRadialLabels).length + i
    const defaultAngle = (Math.PI * 3 / 4) - ((Math.PI / 2) * (index % 4)) - (Math.floor(index / 4) * (Math.PI / 4))
    return {
      ...attrLabel.init(k as string),
      radius: { m: 1, x: EnumVarSymbol.Radius, c: 5 },
      angle: math.angleToDeg(defaultAngle),
      align: 'radial'
    }
  })

  const newOtherLabels = utils.mapDict(newOtherLabelChanges, k => attrLabel.init(k as string))

  return {
    labels: {...newRadialLabels, ...newOtherLabels }
  }
}

export const evaluate = (evaluated: AttrEvalPartial<INodeAttr>, expr: PartialAttr<INodeAttr>,
                         changes: PartialAttr<INodeAttr>): AttrEvalPartial<INodeAttr> => {
  const evalChanges = attrExpr.getEvaluatedChanges(expr, getVariables(evaluated), definition)
  const newEval = attrUtils.merge(evaluated, evalChanges || {}, definition) as AttrEvalPartial<INodeAttr>

  const evalLabelChanges = attrUtils.reduceChanges<INodeAttr['labels']>(expr.labels || {},
    definition.entries.labels, (k, labelExpr) => newEval.labels && newEval.labels[k]
      ? attrExpr.getEvaluatedChanges(labelExpr, getLabelVariables(newEval, newEval.labels[k]), attrLabel.definition)
      : undefined)

  const evalChildChanges: PartialAttr<INodeAttr> = { labels: evalLabelChanges || {} }
  return attrUtils.merge(evalChanges || {}, evalChildChanges, definition) as AttrEvalPartial<INodeAttr>
}

export const getVariables = (attr: AttrEvalPartial<INodeAttr>): attrExpr.VarLookup => {
  const hasWidth = attr.size && attr.size.width !== undefined
  const hasHeight = attr.size && attr.size.height !== undefined
  return {
    ...(hasWidth ? { [EnumVarSymbol.Width]: attr.size.width } : {}),
    ...(attr.shape !== undefined && attr.shape === 'circle' && hasWidth ? { [EnumVarSymbol.Height]: attr.size.width }
      : hasHeight ? { [EnumVarSymbol.Height]: attr.size.height } : {})
  }
}

export const getLabelVariables = (node: AttrEvalPartial<INodeAttr>,
                                  label: AttrEvalPartial<ILabelAttr>): attrExpr.VarLookup => {
  if (node.size && node.size.width !== undefined && node.size.height !== undefined && label.angle !== undefined) {
    const radius = radiusAtAngle(math.angleToRad(label.angle), node.size.width, node.size.height, node.shape)
    return  { [EnumVarSymbol.Radius]: radius }
  } else return {}
}

const initPos = (index: number, offset: number): INodeAttr['pos'] => {
  const sqrtOffset = Math.floor(Math.sqrt(index))
  const sizeInit = Math.pow(sqrtOffset, 2) !== index ? sqrtOffset + 1 : sqrtOffset
  const size = sizeInit % 2 === 0 ? sizeInit + 1 : sizeInit
  const halfSize = Math.floor(size / 2.0)
  const difference = Math.pow(size, 2) - index

  const rawPos =
    difference <= size ? {
      x: -halfSize,
      y: -halfSize + (size - difference)
    } : difference <= (size * 2) - 1 ? {
      x: -halfSize + (difference - size),
      y: -halfSize
    } : difference <= (size * 3) - 2 ? {
      x: halfSize,
      y: -halfSize + (difference - (size * 2)) + 1
    } : {
      x: -halfSize + (size - (difference - (size * 3) + 3)),
      y: halfSize
    }
  return {
    x: rawPos.x * (offset + 1),
    y: rawPos.y * (offset + 1)
  }
}
