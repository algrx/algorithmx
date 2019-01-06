import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Edge | Set color with traverse animation', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes([1, 2]).add()
  canvas.edges([[1, 2, 'a'], [2, 1, 'b']]).add()

  canvas.edge([1, 2, 'a']).duration(30).animate('traverse').color(utils.RED)
  canvas.edge([2, 1, 'b']).duration(30).animate('traverse-reverse').color(utils.RED)

  expect(utils.selectEdge(svg, [1, 2, 'a']).select('.edge-path-overlay')).to.satisfy((s: D3Selection) => !s.empty())
  expect(utils.selectEdge(svg, [2, 1, 'b']).select('.edge-path-overlay')).to.satisfy((s: D3Selection) => !s.empty())

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getEdgeColor(svg, [1, 2, 'a'])).to.eq(utils.RED)
      expect(utils.getEdgeColor(svg, [2, 1, 'b'])).to.eq(utils.RED)
      resolve()
    }, 40)
  })
})

it('Edge | Highlight color with traverse animation', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B']).add()
  canvas.edge(['A', 'B']).add().directed(true).color(utils.GREEN)

  expect(utils.getEdgeColor(svg, ['A', 'B'])).to.eq(utils.GREEN)

  canvas.edge(['A', 'B']).duration(0).highlight(40).color(utils.RED)
  expect(utils.getEdgeColor(svg, ['A', 'B'])).to.eq(utils.RED)

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getEdgeColor(svg, ['A', 'B'])).to.eq(utils.GREEN)
      resolve()
    }, 50)
  })
})
