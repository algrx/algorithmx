import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Animation | Interrupt', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B', 'C', 'D']).add()

  canvas.node('A').duration(0).color(utils.GREEN)
  canvas.node('A').duration(0).color(utils.RED)

  canvas.node('B').duration(0).color(utils.GREEN)
  canvas.node('B').duration(100).color(utils.RED)

  canvas.node('C').duration(100).color(utils.GREEN)
  canvas.node('C').duration(0).color(utils.RED)

  canvas.node('D').duration(100).color(utils.GREEN)
  canvas.node('D').duration(100).color(utils.RED)

  return new Promise(resolve => {
    setTimeout(() => {
      expect(utils.getNodeColor(svg, 'A')).to.eq(utils.RED)
      expect(utils.getNodeColor(svg, 'B')).to.eq(utils.RED)
      expect(utils.getNodeColor(svg, 'C')).to.eq(utils.RED)
      expect(utils.getNodeColor(svg, 'D')).to.eq(utils.RED)
      resolve()
    }, 200)
  })
})

it('Animation | Interrupt with pause', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  return new Promise(resolve => {
    canvas.node('A').duration(0).add()

    canvas.node('A').duration(50).size(90)
    canvas.pause(25)
    canvas.node('A').duration(25).size(60)

    setTimeout(() => {
      expect(utils.getNodeAttr(svg, 'A', 'r')).to.eq('60')
      resolve()
    }, 70)
  })
})
