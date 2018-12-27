import { RenderEndpoint, RenderAttr, IRenderEndpoint } from './process'
import { D3Selection, D3SelTrans } from './utils'
import { ICommonAttr } from '../attributes/definitions/common'
import { IAnimation, AnimationType, AnimationFull } from '../attributes/definitions/animation'
import { getEntry } from './process'
import { Attr, AttrEval, PartialAttr, AttrLookup } from '../attributes/types'
import { Primitive } from '../utils'
import * as renderProcess from './process'
import * as renderFns from './render'

export const renderVisibleLookup = <T extends ICommonAttr> (renderData: RenderAttr<AttrLookup<T>>,
                                                            renderFn: renderFns.RenderLookupFn<T>): void => {
  return renderFns.renderLookup(renderData, (k, data) => {
    if (data.attr.visible) renderFn(k, data)
  })
}

export function renderSvgAttr<T extends Attr> (selection: D3Selection, key: string,
                                               valueFn: ((v: AttrEval<T>) => Primitive),
                                               attr: RenderEndpoint<T>): D3SelTrans {
  return renderFns.render(selection, attr, (s, a) => {
    return s.attr(key, valueFn(a))
  })
}

export const renderCustomSvg: renderFns.RenderAttrFn<ICommonAttr> = (selection, renderData) => {
  const precessKey = (sel, key) => [
    key.includes('@') ? sel.selectAll(key.split('@')[1]) : sel,
    key.includes('@') ? key.split('@')[0] : key
  ]
  renderFns.renderLookup(getEntry(renderData, 'svg'), (_, d: RenderEndpoint<string>) => {
    const [s, k] = precessKey(selection, d.name)
    renderSvgAttr(s, k, v => v, d)
  })
  renderFns.renderLookup(getEntry(renderData, 'css'), (_, d: RenderEndpoint<string>) => {
    const [s, k] = precessKey(selection, d.name)
    renderFns.render(s, d, (styleSel, styleAttr) => {
      return styleSel.style(k, styleAttr)
    })
  })
}

function animateAdd (selection: D3Selection, animation: IAnimation): void {
  if (animation.type === AnimationType.Scale || animation.type === AnimationType.ScaleFade) {
    selection.attr('transform', 'scale(0,0)')
    const transition = renderFns.animate(selection, 'visible-scale', animation).attr('transform', 'scale(1,1)')
    renderFns.newTransition(transition, t => t).attr('transform', null)
  }
  if (animation.type === AnimationType.Fade || animation.type === AnimationType.ScaleFade) {
    selection.attr('opacity', '0')
    const transition = renderFns.animate(selection, 'visible-fade', animation).attr('opacity', '1')
    renderFns.newTransition(transition, t => t).attr('opacity', null)
  }
}

function animateRemove (selection: D3Selection, animation: IAnimation): void {
  if (animation.type === AnimationType.Scale || animation.type === AnimationType.ScaleFade) {
    selection.attr('transform', 'scale(1,1)')
    renderFns.animate(selection, 'visible-scale', animation).attr('transform', 'scale(0,0)')
  }
  if (animation.type === AnimationType.Fade || animation.type === AnimationType.ScaleFade) {
    selection.attr('opacity', '1')
    renderFns.animate(selection, 'visible-fade', animation).attr('opacity', '0')
  }
}

export const renderVisible: renderFns.RenderAttrFn<ICommonAttr['visible']> = (selection, renderData) => {
  renderFns.onChanged(selection, renderData, (sel, visible) => {
    if (!renderFns.isAnimationImmediate(visible.animation)) {
      if (visible.attr === true) animateAdd(sel, visible.animation)
      else animateRemove(sel, visible.animation)
    }
  })
}

export const renderRemove: renderFns.RenderAttrFn<ICommonAttr['visible']> = (selection, renderData) => {
  renderFns.onChanged(selection, renderData, (sel, visible) => {
    if (visible.attr === false) {
      if (renderFns.isAnimationImmediate(visible.animation)) sel.remove()
      else renderFns.transition(sel, 'remove', t => t.delay(visible.animation.duration)).remove()
    }
  })
}

export const markCommonForUpdate = <T extends ICommonAttr>(renderData: RenderAttr<T>): RenderAttr<T> => {
  const visibleData = getEntry(renderData, 'visible')
  return renderProcess.hasChanged(visibleData) && visibleData.attr === true
    ? renderProcess.markForUpdate(renderData) : renderData
}

export const renderCommonRemove = <T extends ICommonAttr>(selection: D3Selection, renderData: RenderAttr<T>,
                                                          renderVisibleFn: renderFns.RenderAttrFn<T['visible']>) => {
  const newVisible = { attr: { visible: false }, changes: { visible: false } } as RenderAttr<PartialAttr<ICommonAttr>>
  const visibleData = getEntry({...renderData, ...newVisible }, 'visible')

  renderVisibleFn(selection, visibleData)
  renderRemove(selection, visibleData)
}

export const renderCommon = <T extends ICommonAttr>(selector: () => D3Selection, renderData: RenderAttr<T>,
                                                    renderFn: renderFns.RenderAttrFn<T>,
                                                    renderVisibleFn: renderFns.RenderAttrFn<T['visible']>) => {
  const visibleData = getEntry(renderData, 'visible')
  const renderDataFull = markCommonForUpdate(renderData)

  if (renderProcess.hasChanged(visibleData) && visibleData.attr === true) selector().remove()
  const selection = selector()

  renderFn(selection, renderDataFull)
  renderVisibleFn(selection, visibleData)
  renderRemove(selection, visibleData)
}

export const renderCommonLookup = <T extends ICommonAttr> (selector: (k: string) => D3Selection,
                                                           renderData: RenderAttr<AttrLookup<T>>,
                                                           renderFn: renderFns.RenderAttrFn<T>,
                                                           renderVisibleFn: renderFns.RenderAttrFn<T['visible']>) => {
  renderFns.renderLookup(renderData, (k, data) =>
    renderCommon(() => selector(k), data, renderFn, renderVisibleFn))

  renderFns.renderLookupRemovals(renderData, (k, data) =>
    renderCommonRemove(selector(k), data, renderVisibleFn))
}
