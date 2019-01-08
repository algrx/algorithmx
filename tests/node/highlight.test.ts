import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Node | Highlight color', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node('A').add().color(utils.GREEN)
  expect(utils.getNodeColor(div, 'A')).to.eq(utils.GREEN)

  canvas.node('A').duration(0).highlight(0.03).color(utils.RED)
  expect(utils.getNodeColor(div, 'A')).to.eq(utils.RED)

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getNodeColor(div, 'A')).to.eq(utils.GREEN)
      resolve()
    }, 50)
  })
})

it('Node | Highlight size using expression', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.node('A').add().size(20)
  expect(utils.getNodeAttr(div, 'A', 'r')).to.eq('20')

  canvas.node('A').duration(0).highlight(0.03).size('1.5x')
  expect(utils.getNodeAttr(div, 'A', 'r')).to.eq('30')

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getNodeAttr(div, 'A', 'r')).to.eq('20')
      resolve()
    }, 50)
  })
})
