import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'
import 'mocha'

it('Edge add', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.edge([1, 2]).add()
  expect(utils.selectEdge(svg, 1, 2)).to.satisfy((s: D3Selection) => s.empty())

  canvas.nodes([1, 2]).add()
  canvas.edge([1, 2]).add()

  expect(utils.selectEdge(svg, 1, 2)).to.satisfy((s: D3Selection) => !s.empty())
})

it('Edge add multiple connecting same nodes', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B']).add()
  canvas.edges([['A', 'B', 1], ['A', 'B', 2]]).add()
  expect(utils.selectEdge(svg, 'A', 'B')).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, 'A', 'B', 1)).to.satisfy((s: D3Selection) => !s.empty())
  expect(utils.selectEdge(svg, 'A', 'B', 2)).to.satisfy((s: D3Selection) => !s.empty())
})

it('Edge remove', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes([1, 2, 3, 4]).add()

  canvas.edge([2, 4]).add()
  canvas.edge([1, 3]).add()

  canvas.edge([1, 2]).remove() // no effect
  canvas.edge([2, 4]).remove()

  expect(utils.selectEdge(svg, 1, 3)).to.satisfy((s: D3Selection) => !s.empty())
  expect(utils.selectEdge(svg, 2, 4)).to.satisfy((s: D3Selection) => s.empty())
})

it('Edge remove by removing connected node', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B', 'C']).add()
  canvas.edges([['A', 'B', 1], ['A', 'B', 2]]).add()
  canvas.edges([['A', 'A']]).add()
  canvas.edges([['A', 'C']]).add()
  canvas.edges([['B', 'C']]).add()

  canvas.node('A').remove()

  expect(utils.selectEdge(svg, 'A', 'B', 1)).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, 'A', 'B', 2)).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, 'A', 'C')).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, 'A', 'A')).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, 'B', 'C')).to.satisfy((s: D3Selection) => !s.empty())
})
