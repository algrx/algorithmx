import { D3Selection } from '../src/client/render/utils'
import { Canvas } from '../src/client/types/events'
import * as renderUtils from '../src/client/render/utils'
import * as renderCanvasUtils from '../src/client/render/canvas/utils'
import * as d3 from '../src/client/render/d3.modules'

export const GREEN = 'rgb(0,255,0)'
export const RED = 'rgb(255,0,0)'

export const createSvg = (width = 100, height = 100): HTMLDivElement => {
  const container = document.createElement('div')
  container.setAttribute('style', `width: ${width}px; height: ${height}px;`)
  return container
}

export const selectCanvas = (canvas: Canvas): D3Selection =>
  renderCanvasUtils.selectCanvas(canvas).select('g')


export const selectNode = (canvas: Canvas, id: string | number): D3Selection => {
  const renderId = renderUtils.renderId(String(id))
  return selectCanvas(canvas).select('.nodes').select(`[id="node-${renderId}"]`)
}

export const selectNodeLabel = (node: D3Selection, id: string | number): D3Selection => {
  const renderId = renderUtils.renderId(String(id))
  return node.select('.node-labels').select(`[id="label-${renderId}"]`)
}

export const getNodeAttr = (canvas: Canvas, id: string | number, attr: string) =>
  selectNode(canvas, id).select('.shape').attr(attr)

export const getNodeColor = (canvas: Canvas, id: string | number) =>
  getNodeAttr(canvas, id, 'fill').replace(/\s/g, '')


export const selectEdge = (canvas: Canvas, source: string | number, target: string | number,
                           id?: string | number): D3Selection => {
  const renderId = renderUtils.renderId(`${source}-${target}${id !== undefined ? '-' + id : ''}`)
  return selectCanvas(canvas).select('.edges').select(`[id="edge-${renderId}"]`)
}

export const getLabelAttr = (label: D3Selection, attr: string) =>
  label.select('text').attr(attr)


export const getTranslation = (transform: string): [number, number] => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.setAttributeNS(null, 'transform', transform)
  const matrix = g.transform.baseVal.consolidate().matrix
  return [matrix.e, -matrix.f]
}

export const getD3 = () => d3
