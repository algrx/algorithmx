import { IEdgeAttr } from '../../attributes/definitions/edge'
import { D3Selection } from '../utils'
import { RenderAttr, getEntry } from '../process'
import * as renderLabel from '../label/render'
import * as renderFns from '../render'
import * as renderCommon from '../common'
import * as renderUtils from '../utils'

export const MARKER_WIDTH = 5

interface RenderMarker {
  readonly path: string
  readonly viewBox: string
  readonly width: number
  readonly height: number
}
const MARKER_ARROW: RenderMarker = {
  path: 'M 0,0 m -5,-5 L 5,0 L -5,5 Z',
  viewBox: '-5 -5 10 10',
  width: MARKER_WIDTH,
  height: 5
}

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.edge-labels', s => s.append('g').classed('edge-labels', true))

export const selectLabel = (sel: D3Selection, id: string): D3Selection => {
  const renderId = renderUtils.renderId(id)
  return renderUtils.selectOrAdd(sel, `#label-${renderId}`, s => s.append('g').attr('id', `label-${renderId}`))
}

const selectMarker = (sel: D3Selection, edgeId: string, markerId: string): D3Selection => {
  const defsSel = renderUtils.selectOrAdd(sel, 'defs', s => s.insert('svg:defs', ':first-child'))
  const fullId = `edge-${edgeId}-${markerId}`
  return renderUtils.selectOrAdd(defsSel, `#marker-${fullId}`, s => {
    const marker = s.append('svg:marker').attr('id', `marker-${fullId}`)
    marker.append('path')
    return marker
  })
}

export const renderMarkers = (selection: D3Selection, renderData: RenderAttr<IEdgeAttr>, edgeId: string) => {
  renderFns.render(selection, getEntry(renderData, 'directed'), (sel, directed) => {
    if (directed) {
      const marketTarget = selectMarker(selection, edgeId, 'target')
      const shape = MARKER_ARROW
      marketTarget.attr('viewBox', shape.viewBox)
        .attr('markerHeight', shape.width).attr('markerWidth', shape.height)
        .attr('markerUnits', 'strokeWidth')
        .attr('orient', 'auto').attr('refX', 0).attr('refY', 0)

      marketTarget.select('path').attr('d', shape.path).attr('fill', renderData.attr.color)
      return sel
    } else {
      selection.select('defs').remove()
      return sel
    }
  })
}

export const renderVisible: renderFns.RenderAttrFn<IEdgeAttr['visible']> = (selection, renderData) => {
  renderCommon.renderVisible(selection.select('.edge-path'), renderData)
}

export const render: renderFns.RenderAttrFn<IEdgeAttr> = (selection, renderData) => {
  const pathSel = renderUtils.selectOrAdd(selection, '.edge-path', s =>
    s.append('path').classed('edge-path', true).attr('fill', 'none').attr('stroke-linecap', 'round'))
  const labelGroup = selectLabelGroup(selection)

  renderCommon.renderCommonLookup(k => selectLabel(labelGroup, k), getEntry(renderData, 'labels'),
    renderLabel.render, renderLabel.renderVisible)

  renderCommon.renderCustomSvg(pathSel, renderData)
  renderCommon.renderSvgAttr(pathSel, 'stroke-width', v => v, getEntry(renderData, 'thickness'))

  const edgeId = selection.attr('id').substr('edge-'.length)
  renderMarkers(selection, renderData, edgeId)

  renderCommon.renderSvgAttr(pathSel, 'marker-end', v =>
    v ? `url(#marker-edge-${edgeId}-target)` : 'url()', getEntry(renderData, 'directed'))

  const markerTarget = selectMarker(selection, edgeId, 'target').select('path')

  renderCommon.renderSvgAttr(markerTarget, 'fill', v => renderUtils.parseColor(v), getEntry(renderData, 'color'))
  renderCommon.renderSvgAttr(pathSel, 'stroke', v => renderUtils.parseColor(v), getEntry(renderData, 'color'))
}
