import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Node | Highlight color', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node('A').add().color(utils.GREEN)
  expect(utils.getNodeColor(svg, 'A')).to.eq(utils.GREEN)

  canvas.node('A').duration(0).highlight(40).color(utils.RED)
  expect(utils.getNodeColor(svg, 'A')).to.eq(utils.RED)

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getNodeColor(svg, 'A')).to.eq(utils.GREEN)
      resolve()
    }, 50)
  })
})

it('Node | Highlight size using expression', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.node('A').add().size(20)
  expect(utils.getNodeAttr(svg, 'A', 'r')).to.eq('20')

  canvas.node('A').duration(0).highlight(40).size('1.5x')
  expect(utils.getNodeAttr(svg, 'A', 'r')).to.eq('30')

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getNodeAttr(svg, 'A', 'r')).to.eq('20')
      resolve()
    }, 50)
  })
})
