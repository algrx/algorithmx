import { expect } from 'chai'
import { D3Selection } from '../../src/client/render/utils'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Canvas | Add and remove', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty())

  canvas.duration(0).node('A').add()
  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty())

  canvas.duration(0).remove()
  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty())

  canvas.duration(0).add()
  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty())
})

it('Canvas | Remove multiple times', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.duration(0).remove()

  canvas.duration(0).node('A').add()
  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty())

  canvas.duration(0).remove()
  canvas.duration(0).remove()
  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty())
})

it('Canvas | Visibility', () => {
  const div = utils.createDiv()
  const canvas = algorithmx.canvas(div)

  canvas.duration(0).remove()
  canvas.duration(0).nodes([1, 2, 3, 4]).add()
  canvas.duration(0).edges([[1, 3], [1, 4], [2, 4], [2, 3]]).add()

  canvas.duration(0).visible(false)
  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty())

  canvas.visible(true)
  expect(utils.selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty())
})
