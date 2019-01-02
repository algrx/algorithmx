import { AnimationFull, IAnimation } from '../attributes/definitions/animation'
import { ICanvasAttr, definition as canvasDef } from '../attributes/definitions/canvas'
import { PartialAttr, AttrEval, AttrEvalPartial } from '../attributes/types'
import { RenderAttr } from '../render/process'
import { Canvas } from '../types/events'
import * as events from '../types/events'
import * as processAttr from './attributes'
import * as processAnim from './animation'
import * as attrAnim from '../attributes/definitions/animation'
import * as preprocessFns from '../attributes/preprocess'
import * as attrCanvas from '../attributes/definitions/canvas'
import * as attrExpr from '../attributes/expressions'
import * as attrUtils from '../attributes/utils'

interface IAttrPreprocessed {
  readonly attributes: PartialAttr<ICanvasAttr>
  readonly animation: PartialAttr<IAnimation>
}

export interface IAttrProcessed {
  readonly attributes: AttrEval<ICanvasAttr>
  readonly changes: AttrEvalPartial<ICanvasAttr>
  readonly expressions: PartialAttr<ICanvasAttr>
  readonly animation: AnimationFull<ICanvasAttr>
}

const preprocess = (attr: unknown, animation: unknown): IAttrPreprocessed | Error => {
  const preAttr = preprocessFns.preprocess(attr, canvasDef)
  const preAnimation = preprocessFns.preprocess(animation, attrAnim.definition)

  if (preAttr instanceof Error) return preAttr
  if (preAnimation instanceof Error) return preAnimation

  return {
    attributes: preAttr,
    animation: preAnimation
  }
}

export const processUpdate = (canvas: Canvas, prevAttr: AttrEval<ICanvasAttr> | undefined,
                              prevExpr: PartialAttr<ICanvasAttr> | undefined,
                              attrData: events.IDispatchUpdate['data']):
                              IAttrProcessed | Error => {
  const preprocessed = preprocess(attrData.attributes, attrData.animation)
  if (preprocessed instanceof Error) return preprocessed

  const changesForced = preprocessed.attributes

  const changesInit = processAttr.initialize(canvas, prevAttr, changesForced)
  const changesEval = processAttr.evaluate(prevAttr, prevExpr, changesInit)
  const changes = attrUtils.merge(changesEval,
    attrCanvas.removeInvalidEdges(prevAttr, changesEval), canvasDef) as AttrEvalPartial<ICanvasAttr>

  const attrMerged = (prevAttr === undefined ? changes : attrUtils.merge(prevAttr, changes, canvasDef))
  const attrRemoved = attrUtils.getNullEntries(changes, canvasDef) as AttrEvalPartial<ICanvasAttr>
  const attributes = attrUtils.subtractFull(attrMerged, attrRemoved, canvasDef) as AttrEval<ICanvasAttr>

  const exprChanged = attrExpr.getPermanentExpr(changesInit, canvasDef)
  const prevExprCleared = attrUtils.subtractChanges(prevExpr || {}, changesInit, canvasDef)
  const expressions = attrUtils.merge(prevExprCleared, exprChanged, canvasDef)

  const animation = processAnim.process(attrData.animation, prevAttr, changes, changesForced)

  return {
    attributes: attributes,
    changes: changes,
    expressions: expressions,
    animation: animation
  }
}

export const processHighlight = (prevState: AttrEval<ICanvasAttr> | undefined,
                                 prevExpr: PartialAttr<ICanvasAttr> | undefined,
                                 attrData: events.IDispatchHighlight['data']):
                                 Pick<IAttrProcessed, 'animation' | 'changes'> | Error => {
  const preprocessed = preprocess(attrData.attributes, attrData.animation)
  if (preprocessed instanceof Error) return preprocessed

  const changes = processAttr.evaluate(prevState, prevExpr, preprocessed.attributes)
  const animation = processAnim.process(attrData.animation || {}, prevState, changes, changes)

  return {
    animation: animation,
    changes: changes
  }
}

export const processReset = (prevAttr: AttrEval<ICanvasAttr> | undefined,
                             attrData: events.IDispatchUpdate['data']): IAttrProcessed | Error => {
  const preAnimation = preprocessFns.preprocess(attrData.animation, attrAnim.definition)
  if (preAnimation instanceof Error) return preAnimation

  const changes = { visible: false }
  return {
    attributes: {...prevAttr, ...changes },
    changes: changes,
    expressions: {},
    animation: processAnim.process(preAnimation, prevAttr, changes, changes)
  }
}

export const getRenderData = (processed: IAttrProcessed): RenderAttr<ICanvasAttr> => {
  return {
    name: 'canvas',
    attr: processed.attributes,
    animation: processed.animation,
    changes: processed.changes
  }
}
