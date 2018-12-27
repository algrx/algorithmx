import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

const DELAY = 50
const DELTA = 10

it('Queue | Pause In series', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  return new Promise(resolve => {
    const nodes: ReadonlyArray<number> = [1, 2, 3]
    canvas.nodes(nodes).duration(0).add().color(utils.RED)
    canvas.pause(DELAY).node(nodes[0]).duration(0).color(utils.GREEN)
    canvas.pause(DELAY).node(nodes[1]).duration(0).color(utils.GREEN)
    canvas.pause(DELAY).node(nodes[2]).duration(0).color(utils.GREEN)
    const getNodeColors = () => nodes.map(n => utils.getNodeColor(svg, n))

    setTimeout(() => expect(getNodeColors()).to.eql([utils.RED, utils.RED, utils.RED]), DELAY - DELTA)
    setTimeout(() => expect(getNodeColors()).to.eql([utils.GREEN, utils.RED, utils.RED]), 2 * DELAY - DELTA)
    setTimeout(() => expect(getNodeColors()).to.eql([utils.GREEN, utils.GREEN, utils.RED]), 3 * DELAY - DELTA)
    setTimeout(() => expect(getNodeColors()).to.eql([utils.GREEN, utils.GREEN, utils.GREEN]), 4 * DELAY - DELTA)
    setTimeout(resolve, 4 * DELAY)
  })
})

it('Pause | In parallel', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  return new Promise(resolve => {
    const nodes: ReadonlyArray<string> = ['A', 'B', 'C']
    canvas.nodes(nodes).duration(0).add().size(25)
    canvas.eventQ(null).pause(DELAY).duration(0).node(nodes[0]).size(40)
    canvas.eventQ('q1').pause(DELAY).duration(0).node(nodes[1]).size(40)
    canvas.eventQ('q2').pause(DELAY).duration(0).node(nodes[2]).size(40)
    const getNodeSizes = () => nodes.map(n => utils.getNodeAttr(svg, n, 'r'))

    setTimeout(() => expect(getNodeSizes()).to.eql(['40', '25', '25']), DELAY - DELTA)
    setTimeout(() => expect(getNodeSizes()).to.eql(['40', '40', '40']), 2 * DELAY - DELTA)
    setTimeout(resolve, 2 * DELAY)
  })
})
