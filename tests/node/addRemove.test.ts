import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Node | Add', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node('A').add()
  expect(utils.selectNode(div, 'A')).to.satisfy((s: D3Selection) => !s.empty())
})

it('Node | Remove', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.nodes(['A', 'B', 'C']).add()

  canvas.node('B').duration(0).remove()
  expect(utils.selectNode(div, 'B')).to.satisfy((s: D3Selection) => s.empty())
})

it('Node | Add then remove then add', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node(1).add()

  canvas.node(1).duration(0).remove()
  expect(utils.selectNode(div, 1)).to.satisfy((s: D3Selection) => s.empty())

  canvas.node(1).duration(0).add()
  expect(utils.selectNode(div, 1)).to.satisfy((s: D3Selection) => !s.empty())
})

it('Node | Visibility', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node(1).add().color(utils.RED)

  canvas.node(1).duration(0).visible(false)
  expect(utils.selectNode(div, 1)).to.satisfy((s: D3Selection) => s.empty())

  canvas.node(1).duration(0).visible(true)
  expect(utils.getNodeColor(div, 1)).to.eq(utils.RED)
})
