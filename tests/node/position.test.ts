import { expect } from 'chai'
import { Canvas } from '../../src/client/types/events'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'
import 'mocha'

const getTranslation = (transform: string): [number, number] => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.setAttributeNS(null, 'transform', transform)
  const matrix = g.transform.baseVal.consolidate().matrix
  return [matrix.e, -matrix.f]
}

const getPosition = (svg: Canvas, id: string | number): [number, number] => {
  return getTranslation(utils.selectNode(svg, id).attr('transform'))
}

it('Node position', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node(1).add().pos([-20, -20])
  expect(getPosition(svg, 1)).to.eql([-20, -20])

  canvas.node(1).pos([50, 50])
  expect(getPosition(svg, 1)).to.eql([50, 50])
})

it('Node position relative to canvas size', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.size([100, 100])

  canvas.node(1).add().pos(['-0.5cx', '0.5cy + 7'])
  expect(getPosition(svg, 1)).to.eql([-25, 32])

  canvas.size([200, 300])

  canvas.node(1).pos(['-0.5cx', '0.5cy + 7'])
  expect(getPosition(svg, 1)).to.eql([-50, 82])
})
