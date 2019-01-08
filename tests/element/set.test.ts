import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Node | Setting multiple attributes', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node(1).add().size(40)
  canvas.node(1).duration(0).set({
    color: utils.RED,
    size: '2x'
  })

  expect(utils.getNodeColor(div, 1)).to.eql(utils.RED)
  expect(utils.getNodeAttr(div, 1, 'r')).to.eql('80')
})

it('Edge | Setting multiple attributes', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.nodes([1, 2]).add()

  const edges: ReadonlyArray<[number, number, string]> = [[1, 2, 'a'], [2, 1, 'b']]
  canvas.edges(edges).add()

  canvas.edges(edges).duration(0).set((edge: [number, number, string]) => ({
    color: edge[2] === 'a' ? utils.GREEN : utils.RED,
    thickness: 5
  }))

  expect(utils.getEdgeColor(div, edges[0])).to.eq(utils.GREEN)
  expect(utils.getEdgeColor(div, edges[1])).to.eq(utils.RED)
  expect(utils.getEdgeAttr(div, edges[1], 'stroke-width')).to.eq('5')
})


it('Label | Setting multiple attributes', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node(1).add().label(1).add()

  canvas.node(1).label(1).duration(0).set({
    size: 20,
    svgattr: {
      'stroke': utils.GREEN,
      'text-decoration': 'underline'
    }
  })

  const labelSel = utils.selectNodeLabel(utils.selectNode(div, 1), 1)

  expect(utils.getLabelAttr(labelSel, 'font-size')).to.eq('20')
  expect(utils.getLabelAttr(labelSel, 'stroke')).to.eq(utils.GREEN)
  expect(utils.getLabelAttr(labelSel, 'text-decoration')).to.eq('underline')
})

it('Node | Highlighting multiple attributes', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node(1).add().size(40).color(utils.GREEN)
  canvas.node(1).duration(0).highlight(0.03).set({
    size: '0.5x',
    color: utils.RED
  })
  expect(utils.getNodeAttr(div, 1, 'r')).to.eq('20')
  expect(utils.getNodeColor(div, 1)).to.eq(utils.RED)

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getNodeAttr(div, 1, 'r')).to.eq('40')
      expect(utils.getNodeColor(div, 1)).to.eq(utils.GREEN)
      resolve()
    }, 50)
  })
})
