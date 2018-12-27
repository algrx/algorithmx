import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Canvas add and remove', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  expect(utils.selectCanvas(svg)).to.satisfy((s: D3Selection) => s.empty())

  canvas.duration(0).node('A').add()
  expect(utils.selectCanvas(svg)).to.satisfy((s: D3Selection) => !s.empty())

  canvas.duration(0).remove()
  expect(utils.selectCanvas(svg)).to.satisfy((s: D3Selection) => s.empty())

  canvas.duration(0).add()
  expect(utils.selectCanvas(svg)).to.satisfy((s: D3Selection) => !s.empty())
})

it('Canvas remove multiple times', () => {
  const svg = utils.createSvg()
  const canvas = algorithmx.canvas(svg)

  canvas.duration(0).remove()

  canvas.duration(0).node('A').add()
  expect(utils.selectCanvas(svg)).to.satisfy((s: D3Selection) => !s.empty())

  canvas.duration(0).remove()
  canvas.duration(0).remove()
  expect(utils.selectCanvas(svg)).to.satisfy((s: D3Selection) => s.empty())
})
