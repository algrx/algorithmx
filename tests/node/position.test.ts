import { expect } from 'chai'
import { Canvas } from '../../src/client/types/events'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

const getPos = (div: Canvas, id: string | number): [number, number] => {
  return utils.getTranslation(utils.selectNode(div, id).attr('transform'))
}

it('Node | Position', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node(1).add().pos([-20, -20])
  expect(getPos(div, 1)).to.eql([-20, -20])

  canvas.node(1).pos([50, 50])
  expect(getPos(div, 1)).to.eql([50, 50])
})

it('Node | Position relative to canvas size', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.duration(0).size([100, 100])

  canvas.node(1).add().pos(['-0.5cx', '0.5cy + 7'])
  expect(getPos(div, 1)).to.eql([-25, 32])

  canvas.size([200, 300])

  canvas.node(1).pos(['-0.5cx', '0.5cy + 7'])
  expect(getPos(div, 1)).to.eql([-50, 82])
})
