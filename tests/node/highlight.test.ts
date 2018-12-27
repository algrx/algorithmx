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
  //
})
