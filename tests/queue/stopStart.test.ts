import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Queue start', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.eventQ(1).pause(10).callback(resolve).stop()
    canvas.eventQ(1).start()
    setTimeout(() => reject(new Error('queue didn\'t start')), 20)
  })
})

it('Queue stop', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(10).callback(() => reject(new Error('queue didn\'t stop')))
    canvas.stop()
    setTimeout(resolve, 20)
  })
})

it('Queue cancel simple', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.eventQ('q1').pause(10).callback(() => reject(new Error('queue didn\'t cancel')))
    canvas.eventQ('q1').cancel()
    setTimeout(resolve, 20)
  })
})

it('Queue cancel complex', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(10).callback(() => reject(new Error('queue didn\'t cancel'))).stop()
    canvas.pause(100).cancel()
    canvas.pause(10).callback(resolve)
    canvas.start()
    setTimeout(() => reject(new Error('queue didn\'t start')), 20)
  })
})

it('Queue pause interrupt', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(10).pause(100).callback(() =>
      reject(new Error('stopping the queue didn\'t invalidate the current pause')))
    canvas.stop().start()

    canvas.pause(10)
    canvas.cancel().pause(100).callback(() =>
      reject(new Error('clearing the queue didn\'t invalidate the current pause')))
    setTimeout(resolve, 20)
  })
})
