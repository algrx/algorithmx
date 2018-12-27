import { D3Selection } from '../src/client/render/utils'
import { Canvas } from '../src/client/types/events'
import * as d3 from '../src/client/render/d3.modules'
import * as renderUtils from '../src/client/render/canvas/utils'

export const createSvg = (width = 200, height = 200): HTMLDivElement => {
  const container = document.createElement('div')
  container.setAttribute('style', `width: ${width}px; height: ${height}px;`)
  return container
}

export const selectCanvas = (svg: Canvas): D3Selection =>
  renderUtils.selectCanvas(svg).select('g')

export const selectNode = (svg: Canvas, id: string | number): D3Selection =>
  selectCanvas(svg).select('.nodes').select(`[id="node-${id}"]`)

export const selectEdge = (svg: Canvas, source: string | number, target: string | number,
                           id?: string | number): D3Selection =>
 selectCanvas(svg).select('.edges')
    .select(`[id="edge-${source}-${target}${id !== undefined ? '-' + id : ''}"]`)

export const getNodeAttr = (svg: Canvas, id: string | number, attr: string) =>
  selectNode(svg, id).select('.shape').attr(attr)

export const getD3 = () => d3
