import { RenderAttr, RenderEndpoint } from './process'
import { D3Selection, D3Transition, D3SelTrans } from './utils'
import { IAnimation } from '../attributes/definitions/animation'
import { Attr, AttrEval, AttrLookup } from '../attributes/types'
import * as renderProcess from './process'
import * as renderUtils from './utils'

export type RenderFn<T extends Attr> = (selection: D3SelTrans, value: AttrEval<T>) => D3SelTrans
export type RenderAttrFn<T extends Attr> = (selection: D3Selection, renderData: RenderAttr<T>) => void

export const canAnimate = () => {
  // only browsers support animations
  return renderUtils.isInBrowser()
}

type TransCallback = (trans: D3Transition) => D3Transition
export const transition = (selection: D3Selection, name: string, callback: TransCallback): D3SelTrans => {
  if (!canAnimate()) return selection
  else return callback(selection.transition(name))
}
export const newTransition = (selection: D3SelTrans, callback: TransCallback): D3SelTrans => {
  if (!canAnimate()) return selection
  else return callback(selection.transition())
}
export const updateTransition = (selection: D3SelTrans, callback: TransCallback): D3SelTrans => {
  if (renderUtils.isTransition(selection)) return callback(selection)
  else return selection
}

export const parseTime = (time: number): number => {
  return time
}

export const isAnimationImmediate = (animation: IAnimation | undefined) =>
  animation === undefined || animation.duration === 0

export const transAnimate = (trans: D3Transition, animation: IAnimation): D3Transition => {
  if (isAnimationImmediate(animation)) return trans.duration(0)
  else return trans.duration(parseTime(animation.duration)).ease(renderUtils.easeFn(animation.ease))
}
export const animate = (selection: D3Selection, name: string, animation: IAnimation): D3SelTrans => {
  if (isAnimationImmediate(animation)) {
    selection.interrupt(name) // cancel previous transition
    return selection
  } else {
    return transition(selection, name, t => transAnimate(t, animation))
  }
}

export const onChanged = <T extends Attr>(selection: D3Selection, renderData: RenderEndpoint<T>,
                                          callback: ((s: D3Selection, d: RenderEndpoint<T>) => void)): void => {
  if (renderProcess.hasChanged(renderData))
    callback(selection, renderData)
}

export const render = <T extends Attr>(selection: D3Selection, renderData: RenderEndpoint<T>,
                                       renderFn: RenderFn<T>): D3SelTrans => {
  if (renderData.highlight !== undefined) return renderHighlight(selection, renderData, renderFn, renderFn)
  else return renderNoHighlight(selection, renderData, renderFn)
}

export const renderNoHighlight = <T extends Attr>(selection: D3Selection, renderData: RenderEndpoint<T>,
                                                  renderFn: RenderFn<T>): D3SelTrans => {
  if (renderData.changes !== undefined) {
    return renderFn(animate(selection, renderData.name, renderData.animation), renderData.attr)
  } else return selection
}

export const renderHighlight = <T extends Attr>(selection: D3Selection, renderData: RenderEndpoint<T>,
                                                renderStartFn: RenderFn<T>, renderEndFn: RenderFn<T>): D3SelTrans => {
  const initTrans = renderStartFn(animate(selection, renderData.name, renderData.animation), renderData.highlight)

  const linger = renderData.animation ? renderData.animation.linger : 0
  const newTrans = newTransition(initTrans, t => transAnimate(t.delay(parseTime(linger)), renderData.animation))
  return renderEndFn(newTrans, renderData.attr)
}

export type RenderLookupFn<T> = (k: string, renderData: RenderAttr<T>) => void
export const renderLookup = <T extends Attr>(renderData: RenderAttr<AttrLookup<T>>,
                                             renderFn: RenderLookupFn<T>): void => {
  Object.entries(renderData.attr).forEach(([k, v]) => {
    const entry = renderProcess.getEntry<AttrLookup<T>, string>(renderData, k)
    if (v !== null && renderProcess.hasChanged(entry)) renderFn(k, entry)
  })
}

export const renderLookupRemovals = <T extends Attr>(renderData: RenderAttr<AttrLookup<T>>,
                                                     renderFn: RenderLookupFn<T>): void => {
  Object.entries(renderData.changes || {}).forEach(([k, v]) => {
    const entry = renderProcess.getEntry<AttrLookup<T>, string>(renderData, k)
    if (v === null) renderFn(k, entry)
  })
}
