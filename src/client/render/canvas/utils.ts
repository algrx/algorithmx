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

export const selectCanvasContainer = (canvas: Canvas): D3Selection => {
  return typeof canvas === 'string' ? d3.select(`#${canvas}`) : d3.select(canvas)
}
export const selectCanvas = (canvas: Canvas): D3Selection => {
  const container = selectCanvasContainer(canvas)
  return renderUtils.selectOrAdd(container, '.algorithmx', s => s.append('svg').classed('algorithmx', true))
}

export const canvasSize = (canvas: Canvas): [number, number] => {
  const svgBase = selectCanvasContainer(canvas)

  if (svgBase !== null) {
    return [
      (svgBase.node() as Element).getBoundingClientRect().width,
      (svgBase.node() as Element).getBoundingClientRect().height
    ]
  } else if (renderUtils.isInBrowser() && typeof canvas === 'string' && document.getElementById(canvas) !== null) {
    return [
      document.getElementById(canvas).clientWidth,
      document.getElementById(canvas).clientHeight
    ]
  } else return [100, 100]
}
