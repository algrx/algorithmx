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


type EdgeSelector = [string | number, string | number, (string | number)?]

export const selectEdge = (canvas: Canvas, edge: EdgeSelector): D3Selection => {
  const orderedNodes = [edge[0], edge[1]].sort()
  const edgeIdFull = `${orderedNodes[0]}-${orderedNodes[1]}${edge[2] !== undefined ? '-' + edge[2] : ''}`
  const renderId = renderUtils.renderId(edgeIdFull)
  return selectCanvas(canvas).select('.edges').select(`[id="edge-${renderId}"]`)
}
export const getEdgeAttr = (canvas: Canvas, edge: EdgeSelector, attr: string) =>
  selectEdge(canvas, edge).select('.edge-path').attr(attr)

export const getEdgeColor = (canvas: Canvas, edge: EdgeSelector) =>
  getEdgeAttr(canvas, edge, 'stroke').replace(/\s/g, '')


export const getLabelAttr = (label: D3Selection, attr: string) =>
  label.select('text').attr(attr)


export const getTranslation = (transform: string): [number, number] => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.setAttributeNS(null, 'transform', transform)
  const matrix = g.transform.baseVal.consolidate().matrix
  return [matrix.e, -matrix.f]
}

export const getD3 = () => d3
