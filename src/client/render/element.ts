import { RenderEndpoint, RenderAttr } from './process'
import { D3Selection, D3SelTrans } from './utils'
import { IElementAttr, ISvgMixinAttr } from '../attributes/definitions/element'
import { IAnimation } from '../attributes/definitions/animation'
import { getEntry } from './process'
import { Attr, AttrEval, PartialAttr, AttrLookup } from '../attributes/types'
import { Primitive } from '../utils'
import * as renderProcess from './process'
import * as renderFns from './render'

export const renderVisibleLookup = <T extends IElementAttr>(renderData: RenderAttr<AttrLookup<T>>,
                                                            renderFn: renderFns.RenderLookupFn<T>): void => {
  return renderFns.renderLookup(renderData, (k, data) => {
    if (data.attr.visible) renderFn(k, data)
  })
}

export const renderSvgAttr = <T extends Attr>(selection: D3Selection, key: string,
                                              valueFn: ((v: AttrEval<T>) => Primitive),
                                              attr: RenderEndpoint<T>): D3SelTrans => {
  return renderFns.render(selection, attr, (s, a) => {
    return s.attr(key, valueFn(a))
  })
}

export const renderSvgMixin: renderFns.RenderAttrFn<ISvgMixinAttr> = (selection, renderData) => {
  const precessKey = (sel, key) => [
    key.includes('@') ? sel.selectAll(key.split('@')[1]) : sel,
    key.includes('@') ? key.split('@')[0] : key
  ]
  renderFns.renderLookup(getEntry(renderData, 'svgattr'), (_, d) => {
    const [s, k] = precessKey(selection, d.name)
    renderSvgAttr(s, k, v => v, d)
  })
  renderFns.renderLookupRemovals(getEntry(renderData, 'svgattr'), (_, d) => {
    const [s, k] = precessKey(selection, d.name)
    renderSvgAttr(s, k, v => null, d)
  })
}

const animateAdd = (selection: D3Selection, animation: IAnimation): void => {
  if (animation.type === 'scale' || animation.type === 'scale-fade') {
    selection.attr('transform', 'scale(0,0)')
    const transition = renderFns.animate(selection, 'visible-scale', animation).attr('transform', 'scale(1,1)')
    renderFns.newTransition(transition, t => t).attr('transform', null)
  }
  if (animation.type === 'fade' || animation.type === 'scale-fade') {
    selection.attr('opacity', '0')
    const transition = renderFns.animate(selection, 'visible-fade', animation).attr('opacity', '1')
    renderFns.newTransition(transition, t => t).attr('opacity', null)
  }
}

const animateRemove = (selection: D3Selection, animation: IAnimation): void => {
  if (animation.type === 'scale' || animation.type === 'scale-fade') {
    selection.attr('transform', 'scale(1,1)')
    renderFns.animate(selection, 'visible-scale', animation).attr('transform', 'scale(0,0)')
  }
  if (animation.type === 'fade' || animation.type === 'scale-fade') {
    selection.attr('opacity', '1')
    renderFns.animate(selection, 'visible-fade', animation).attr('opacity', '0')
  }
}

export const renderVisible: renderFns.RenderAttrFn<IElementAttr['visible']> = (selection, renderData) => {
  renderFns.onChanged(selection, renderData, (sel, visible) => {
    if (!renderFns.isAnimationImmediate(visible.animation)) {
      if (visible.attr === true) animateAdd(sel, visible.animation)
      else animateRemove(sel, visible.animation)
    }
  })
}

export const renderRemove: renderFns.RenderAttrFn<IElementAttr['visible']> = (selection, renderData) => {
  renderFns.onChanged(selection, renderData, (sel, visible) => {
    if (visible.attr === false) {
      if (renderFns.isAnimationImmediate(visible.animation)) sel.remove()
      else renderFns.transition(sel, 'remove', t => t.delay(renderFns.parseTime(visible.animation.duration))).remove()
    }
  })
}

export const preprocess = <T extends IElementAttr>(renderData: RenderAttr<T>): RenderAttr<T> => {
  const visibleData = getEntry(renderData, 'visible')
  return renderProcess.hasChanged(visibleData) && visibleData.attr === true
    ? renderProcess.markForUpdate(renderData) : renderData
}

export const renderElementRemove = <T extends IElementAttr>(selection: D3Selection, renderData: RenderAttr<T>,
                                                            renderVisibleFn: renderFns.RenderAttrFn<T['visible']>) => {
  const newVisible = { attr: { visible: false }, changes: { visible: false } } as RenderAttr<PartialAttr<IElementAttr>>
  const visibleData = getEntry({...renderData, ...newVisible }, 'visible')

  renderVisibleFn(selection, visibleData)
  renderRemove(selection, visibleData)
}

export const renderElement = <T extends IElementAttr>(selector: () => D3Selection, renderData: RenderAttr<T>,
                                                      renderFn: renderFns.RenderAttrFn<T>,
                                                      renderVisibleFn: renderFns.RenderAttrFn<T['visible']>) => {
  const renderDataFull = preprocess(renderData)
  const visibleData = getEntry(renderData, 'visible')

  if (renderProcess.hasChanged(visibleData) && visibleData.attr === true) selector().remove()
  const selection = selector()

  renderFn(selection, renderDataFull)
  renderVisibleFn(selection, visibleData)
  renderRemove(selection, visibleData)
}

export const renderElementLookup = <T extends IElementAttr>(selector: (k: string) => D3Selection,
                                                            renderData: RenderAttr<AttrLookup<T>>,
                                                            renderFn: renderFns.RenderAttrFn<T>,
                                                            renderVisibleFn: renderFns.RenderAttrFn<T['visible']>) => {
  renderFns.renderLookup(renderData, (k, data) =>
    renderElement(() => selector(k), data, renderFn, renderVisibleFn))

  renderFns.renderLookupRemovals(renderData, (k, data) =>
    renderElementRemove(selector(k), data, renderVisibleFn))
}
