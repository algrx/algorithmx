import { IEdgeAttr } from '../../attributes/definitions/edge'
import { D3Selection } from '../utils'
import { RenderAttr, getEntry } from '../process'
import * as edgeColor from './color'
import * as renderLabel from '../label/render'
import * as renderFns from '../render'
import * as renderElement from '../element'
import * as renderUtils from '../utils'

export const MARKER_SIZE = 10

interface RenderMarker {
  readonly path: string
  readonly viewBox: string
  readonly size: number
}
const MARKER_ARROW: RenderMarker = {
  path: 'M 0,0 m -5,-5 L 5,0 L -5,5 Z',
  viewBox: '-5 -5 10 10',
  size: MARKER_SIZE
}

export const selectEdgeInner = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.edge', s => s.append('g').classed('edge', true))

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

export const renderMarkers = (selection: D3Selection, renderData: RenderAttr<IEdgeAttr>, edgeId: string): void => {
  renderFns.render(selection, getEntry(renderData, 'directed'), (sel, directed) => {
    if (directed) {
      const marketTarget = selectMarker(selection, edgeId, 'target')
      const shape = MARKER_ARROW
      marketTarget.attr('viewBox', shape.viewBox)
        .attr('markerWidth', shape.size).attr('markerHeight', shape.size)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('orient', 'auto').attr('refX', 0).attr('refY', 0)
      marketTarget.select('path')
        .attr('d', shape.path)
        .attr('fill', renderUtils.parseColor(renderData.attr.color))
      return sel
    } else {
      selection.select('defs').remove()
      return sel
    }
  })
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

  const edgeRenderId = selection.attr('id').substr('edge-'.length)
  renderMarkers(edgeSel, renderData, edgeRenderId)

  renderElement.renderSvgAttr(pathSel, 'marker-end', v =>
    v ? `url(#marker-edge-${edgeRenderId}-target)` : null, getEntry(renderData, 'directed'))

  const markerTarget = selectMarker(edgeSel, edgeRenderId, 'target').select('path')

  const overlaySelector = () => edgeColor.selectOverlay(edgeSel, edgeRenderId)
  edgeColor.renderColor(pathSel, markerTarget, overlaySelector, renderData)

  renderElement.renderSvgMixinAttr(pathSel, renderData)
}
