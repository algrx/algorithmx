import { IEdgeAttr } from '../../attributes/definitions/edge'
import { D3Selection } from '../utils'
import { getEntry } from '../process'
import * as edgeColor from './color'
import * as renderLabel from '../label/render'
import * as renderFns from '../render'
import * as renderElement from '../element'
import * as renderMarker from './marker'
import * as renderUtils from '../utils'

export const selectEdgeInner = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.edge', s => s.append('g').classed('edge', true))

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.edge-labels', s => s.append('g').classed('edge-labels', true))

export const selectLabel = (sel: D3Selection, id: string): D3Selection => {
  const renderId = renderUtils.renderId(id)
  return renderUtils.selectOrAdd(sel, `#label-${renderId}`, s => s.append('g').attr('id', `label-${renderId}`))
}

export const renderVisible: renderFns.RenderAttrFn<IEdgeAttr['visible']> = (selection, renderData) => {
  renderElement.renderVisible(selection.select('.edge'), renderData)
}

export const render: renderFns.RenderAttrFn<IEdgeAttr> = (selection, renderData) => {
  const edgeSel = selectEdgeInner(selection)
  const pathSel = renderUtils.selectOrAdd(edgeSel, '.edge-path', s =>
    s.append('path').classed('edge-path', true).attr('fill', 'none').attr('stroke-linecap', 'round'))
  const labelGroup = selectLabelGroup(edgeSel)

  renderElement.renderElementLookup(k => selectLabel(labelGroup, k), getEntry(renderData, 'labels'),
    renderLabel.render, renderLabel.renderVisible)

  renderElement.renderSvgAttr(pathSel, 'stroke-width', v => v, getEntry(renderData, 'thickness'))

  renderMarker.render(edgeSel, renderData)

  renderElement.renderSvgAttr(pathSel, 'marker-end', v =>
    v ? `url(#${renderMarker.getFullId(edgeSel, 'target')})` : null, getEntry(renderData, 'directed'))

  const markerSelector = () => renderMarker.select(edgeSel, 'target').select('path')
  const overlaySelector = () => edgeColor.selectOverlay(edgeSel, renderData)

  edgeColor.renderColor(pathSel, markerSelector, overlaySelector, renderData)

  renderElement.renderSvgAttrMixin(pathSel, renderData)
}
