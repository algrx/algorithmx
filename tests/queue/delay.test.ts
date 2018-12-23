import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'
import 'mocha'

const DELAY = 50
const DELTA = 10

it('Delay in series', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  return new Promise(resolve => {
    const nodes: ReadonlyArray<number> = [1, 2, 3]
    canvas.nodes(nodes).add().color('red')
    canvas.pause(DELAY).node(nodes[0]).color('green')
    canvas.pause(DELAY).node(nodes[1]).color('green')
    canvas.pause(DELAY).node(nodes[2]).color('green')
    const getNodeColors = () => nodes.map(n => utils.getNodeAttr(svg, n, 'fill'))

    setTimeout(() => expect(getNodeColors()).to.eql(['red', 'red', 'red']), DELAY - DELTA)
    setTimeout(() => expect(getNodeColors()).to.eql(['green', 'red', 'red']), 2 * DELAY - DELTA)
    setTimeout(() => expect(getNodeColors()).to.eql(['green', 'green', 'red']), 3 * DELAY - DELTA)
    setTimeout(() => expect(getNodeColors()).to.eql(['green', 'green', 'green']), 4 * DELAY - DELTA)
    setTimeout(resolve, 4 * DELAY)
  })
})

it('Delay in parallel', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  return new Promise(resolve => {
    const nodes: ReadonlyArray<string> = ['A', 'B', 'C']
    canvas.nodes(nodes).add().size(25)
    canvas.eventQ(null).pause(DELAY).node(nodes[0]).size(40)
    canvas.eventQ('q1').pause(DELAY).node(nodes[1]).size(40)
    canvas.eventQ('q2').pause(DELAY).node(nodes[2]).size(40)
    const getNodeSizes = () => nodes.map(n => utils.getNodeAttr(svg, n, 'r'))

    setTimeout(() => expect(getNodeSizes()).to.eql(['40', '25', '25']), DELAY - DELTA)
    setTimeout(() => expect(getNodeSizes()).to.eql(['40', '40', '40']), 2 * DELAY - DELTA)
    setTimeout(resolve, 2 * DELAY)
  })
})
