import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Edge | Add', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  // not a valid edge, since nodes don't exist
  canvas.edge([1, 2]).add()
  expect(utils.selectEdge(svg, [1, 2])).to.satisfy((s: D3Selection) => s.empty())

  canvas.nodes([1, 2]).add()
  canvas.edge([1, 2]).add()

  expect(utils.selectEdge(svg, [1, 2])).to.satisfy((s: D3Selection) => !s.empty())
})

it('Edge | Add multiple edges connecting the same nodes', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B']).add()

  canvas.edges([['A', 'B', 1], ['A', 'B', 2]]).add()
  expect(utils.selectEdge(svg, ['A', 'B'])).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, ['A', 'B', 1])).to.satisfy((s: D3Selection) => !s.empty())
  expect(utils.selectEdge(svg, ['A', 'B', 2])).to.satisfy((s: D3Selection) => !s.empty())
})

it('Edge | Change (source, target) order', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes([1, 2, 'A', 'B']).add()

  canvas.edge([1, 2]).add()
  canvas.edge([2, 1]).duration(0).color(utils.RED)
  expect(utils.getEdgeColor(svg, [1, 2])).to.eq(utils.RED)

  canvas.edges([['A', 'B', 1], ['B', 'A', 2]]).add().directed(true)

  canvas.edge(['B', 'A', 1]).duration(0).color(utils.RED)
  expect(utils.getEdgeColor(svg, ['A', 'B', 1])).to.eq(utils.RED)
})

it('Edge | Remove', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes([1, 2, 3, 4]).add()

  canvas.edge([2, 4]).add()
  canvas.edge([1, 3]).add()

  canvas.edge([1, 2]).duration(0).remove() // no effect
  canvas.edge([2, 4]).duration(0).remove()

  expect(utils.selectEdge(svg, [1, 3])).to.satisfy((s: D3Selection) => !s.empty())
  expect(utils.selectEdge(svg, [2, 4])).to.satisfy((s: D3Selection) => s.empty())
})

it('Edge | Remove edges by removing connected node', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B', 'C']).add()
  canvas.edges([['A', 'B', 1], ['A', 'B', 2]]).add()
  canvas.edges([['A', 'A']]).add()
  canvas.edges([['A', 'C']]).add()
  canvas.edges([['B', 'C']]).add()

  canvas.node('A').duration(0).remove()

  expect(utils.selectEdge(svg, ['A', 'B', 1])).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, ['A', 'B', 2])).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, ['A', 'C'])).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, ['A', 'A'])).to.satisfy((s: D3Selection) => s.empty())
  expect(utils.selectEdge(svg, ['B', 'C'])).to.satisfy((s: D3Selection) => !s.empty())
})
