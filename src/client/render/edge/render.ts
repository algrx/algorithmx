import { IEdgeAttr } from '../../attributes/definitions/edge'
import { D3Selection } from '../utils'
import { getEntry } from '../process'
import * as renderLabel from '../label/render'
import * as renderFns from '../render'
import * as renderCommon from '../common'
import * as renderUtils from '../utils'

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.edge-labels', s => s.append('g').classed('edge-labels', true))

export const selectLabel = (sel: D3Selection, id: string): D3Selection => {
  const renderId = renderUtils.renderId(id)
  return renderUtils.selectOrAdd(sel, `#label-${renderId}`, s => s.append('g').attr('id', `label-${renderId}`))
}

export const renderVisible: renderFns.RenderAttrFn<IEdgeAttr['visible']> = (selection, renderData) => {
  renderCommon.renderVisible(selection.select('path'), renderData)
}

export const renderColor: renderFns.RenderAttrFn<IEdgeAttr['color']> = (pathSel, renderData) => {
  renderCommon.renderSvgAttr(pathSel, 'stroke', v => v, renderData)
}

export const render: renderFns.RenderAttrFn<IEdgeAttr> = (selection, renderData) => {
  const pathSel = renderUtils.selectOrAdd(selection, 'path', s => s.append('path').attr('fill', 'none'))
  const labelGroup = selectLabelGroup(selection)

  renderCommon.renderCommonLookup(k => selectLabel(labelGroup, k), getEntry(renderData, 'labels'),
    renderLabel.render, renderLabel.renderVisible)

  renderCommon.renderCustomSvg(pathSel, renderData)
  renderCommon.renderSvgAttr(pathSel, 'stroke-width', v => v, getEntry(renderData, 'thickness'))

  renderColor(pathSel, getEntry(renderData, 'color'))
}
