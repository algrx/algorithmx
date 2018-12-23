import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'
import 'mocha'

it('Animation override', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.nodes(['A', 'B', 'C', 'D']).add()

  canvas.node('A').duration(0).color('green')
  canvas.node('A').duration(0).color('red')
  expect(utils.getNodeAttr(svg, 'A', 'fill')).to.eq('red')

  canvas.node('B').duration(0).color('green')
  canvas.node('B').duration(200).color('red')
  expect(utils.getNodeAttr(svg, 'B', 'fill')).to.eq('red')

  canvas.node('C').duration(200).color('green')
  canvas.node('C').duration(0).color('red')
  expect(utils.getNodeAttr(svg, 'C', 'fill')).to.eq('red')

  canvas.node('C').duration(200).color('green')
  canvas.node('C').duration(200).color('red')
  expect(utils.getNodeAttr(svg, 'C', 'fill')).to.eq('red')
})

it('Animation override with pause', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  return new Promise((resolve, reject) => {
    canvas.node('A').add()

    canvas.node('A').duration(50).size(90)
    canvas.pause(25)
    canvas.node('A').size(60)

    setTimeout(() => {
      expect(utils.getNodeAttr(svg, 'A', 'r')).to.eq('60')
      resolve()
    }, 30)
  })
})
