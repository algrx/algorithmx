import { D3Selection } from '../utils'
import { Canvas } from '../../types/events'
import * as renderUtils from '../utils'
import * as d3 from '../d3.modules'

export const selectCanvasInner = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, 'g', s => s.append('g'))

export const selectNodeGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.nodes', s => s.append('g').classed('nodes', true))

export const selectEdgeGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.edges', s => s.append('g').classed('edges', true))

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.labels', s => s.append('g').classed('labels', true))

export const selectNode = (sel: D3Selection, id: string): D3Selection =>
  renderUtils.selectOrAdd(sel, `#node-${id}`, s => s.append('g').attr('id', `node-${id}`))

export const selectEdge = (sel: D3Selection, id: string): D3Selection =>
  renderUtils.selectOrAdd(sel, `#edge-${id}`, s => s.append('g').attr('id', `edge-${id}`))

export const selectLabel = (sel: D3Selection, id: string): D3Selection =>
  renderUtils.selectOrAdd(sel, `#label-${id}`, s => s.append('g').attr('id', `label-${id}`))

export const selectCanvas = (canvas: Canvas): D3Selection => {
  if (typeof canvas === 'string') {
    const container = d3.select(`#${canvas}`)
    if (container.select('svg').empty()) return container.append('svg')
    else return container.select('svg')
  }
  return d3.select(canvas)
}

export const canvasSize = (canvas: Canvas): [number, number] => {
  const svgBase = selectCanvas(canvas)

  if (svgBase !== null && svgBase.attr('width') === null) svgBase.attr('width', '100%')
  if (svgBase !== null && svgBase.attr('height') === null) svgBase.attr('height', '100%')

  const svgSize: [number, number] = svgBase !== null ? [
    (svgBase.node() as Element).getBoundingClientRect().width,
    (svgBase.node() as Element).getBoundingClientRect().height
  ] : null
  const docSize: [number, number] = renderUtils.isInBrowser() && typeof canvas === 'string'
    && document.getElementById(canvas) !== null ? [
    document.getElementById(canvas).clientWidth,
    document.getElementById(canvas).clientHeight
  ] : null

  return svgSize !== null ? svgSize : docSize !== null ? docSize : [100, 100]
}
