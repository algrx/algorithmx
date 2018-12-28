import { expect } from 'chai'
import { Canvas } from '../../src/client/types/events'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

const getPos = (svg: Canvas, id: string | number): [number, number] => {
  return utils.getTranslation(utils.selectNode(svg, id).attr('transform'))
}

it('Node | Position', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node(1).add().pos([-20, -20])
  expect(getPos(svg, 1)).to.eql([-20, -20])

  canvas.node(1).pos([50, 50])
  expect(getPos(svg, 1)).to.eql([50, 50])
})

it('Node | Position relative to canvas size', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.duration(0).size([100, 100])

  canvas.node(1).add().pos(['-0.5cx', '0.5cy + 7'])
  expect(getPos(svg, 1)).to.eql([-25, 32])

  canvas.size([200, 300])

  canvas.node(1).pos(['-0.5cx', '0.5cy + 7'])
  expect(getPos(svg, 1)).to.eql([-50, 82])
})
