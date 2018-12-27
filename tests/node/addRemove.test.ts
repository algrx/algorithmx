import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Node add', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node('A').add()
  expect(utils.selectNode(svg, 'A')).to.satisfy((s: D3Selection) => !s.empty())
})

it('Node remove', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B', 'C']).add()

  canvas.node('B').remove()
  expect(utils.selectNode(svg, 'B')).to.satisfy((s: D3Selection) => s.empty())
})

it('Node add then remove then add', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node(1).add()
  canvas.node(1).remove()
  canvas.node(1).add()
  expect(utils.selectNode(svg, 1)).to.satisfy((s: D3Selection) => !s.empty())
})

it('Node visibility', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node(1).add().color('red')

  canvas.node(1).visible(false)
  expect(utils.selectNode(svg, 1)).to.satisfy((s: D3Selection) => !s.empty())

  canvas.node(1).visible(true)
  expect(utils.getNodeAttr(svg, 1, 'fill')).to.eq('red')
})
