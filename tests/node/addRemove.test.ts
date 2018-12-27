import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Node | Add', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node('A').add()
  expect(utils.selectNode(svg, 'A')).to.satisfy((s: D3Selection) => !s.empty())
})

it('Node | Remove', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B', 'C']).add()

  canvas.node('B').duration(0).remove()
  expect(utils.selectNode(svg, 'B')).to.satisfy((s: D3Selection) => s.empty())
})

it('Node | Add then remove then add', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node(1).add()

  canvas.node(1).duration(0).remove()
  expect(utils.selectNode(svg, 1)).to.satisfy((s: D3Selection) => s.empty())

  canvas.node(1).duration(0).add()
  expect(utils.selectNode(svg, 1)).to.satisfy((s: D3Selection) => !s.empty())
})

it('Node | Visibility', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node(1).add().color(utils.RED)

  canvas.node(1).duration(0).visible(false)
  expect(utils.selectNode(svg, 1)).to.satisfy((s: D3Selection) => s.empty())

  canvas.node(1).duration(0).visible(true)
  expect(utils.getNodeColor(svg, 1)).to.eq(utils.RED)
})
