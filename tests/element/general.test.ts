import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Node | Setting custom attributes', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node(1).add().size(40)
  canvas.node(1).duration(0).set({
    color: utils.RED,
    size: '2x'
  })

  expect(utils.getNodeColor(svg, 1)).to.eql(utils.RED)
  expect(utils.getNodeAttr(svg, 1, 'r')).to.eql('80')
})

it('Edge | Setting custom attributes', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes([1, 2]).add()

  const edges: ReadonlyArray<[number, number, string]> = [[1, 2, 'a'], [2, 1, 'b']]
  canvas.edges(edges).add()

  canvas.edges(edges).duration(0).set((edge: [number, number, string]) => ({
    color: edge[2] === 'a' ? utils.GREEN : utils.RED,
    thickness: 5
  }))

  expect(utils.getEdgeColor(svg, edges[0])).to.eql(utils.GREEN)
  expect(utils.getEdgeColor(svg, edges[1])).to.eql(utils.RED)
  expect(utils.getEdgeAttr(svg, edges[1], 'stroke-width')).to.eql('5')
})
