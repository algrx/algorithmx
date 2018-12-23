import { IEdgeAttr } from '../../attributes/definitions/edge'
import { D3Selection } from '../utils'
import { getEntry } from '../process'
import * as renderLabel from '../label/render'
import * as renderFns from '../render'
import * as renderCommon from '../common'
import * as renderUtils from '../utils'

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.edge-labels', s => s.append('g').classed('edge-labels', true))

export const selectLabel = (sel: D3Selection, id: string): D3Selection =>
  renderUtils.selectOrAdd(sel, `#label-${id}`, s => s.append('g').attr('id', `label-${id}`))

export const renderVisible: renderFns.RenderAttrFn<IEdgeAttr['visible']> = (selection, renderData) => {
  renderCommon.renderVisible(selection.select('path'), renderData)
}

export const render: renderFns.RenderAttrFn<IEdgeAttr> = (selection, renderData) => {
  const labelGroup = selectLabelGroup(selection)
  const pathSelection = renderUtils.selectOrAdd(selection, 'path', s =>
    s.append('path').attr('fill', 'none'))

  renderCommon.renderCommonLookup(k => selectLabel(labelGroup, k), getEntry(renderData, 'labels'),
    renderLabel.render, renderLabel.renderVisible)

  renderCommon.renderCustomSvg(pathSelection, renderData)
  renderCommon.renderSvgAttr(pathSelection, 'stroke', v => v, getEntry(renderData, 'color'))
  renderCommon.renderSvgAttr(pathSelection, 'stroke-width', v => v, getEntry(renderData, 'width'))
}
