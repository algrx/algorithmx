import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Queue | Start', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.eventQ(1).pause(10).callback(resolve)
    canvas.stop(1)
    canvas.start(1)
    setTimeout(() => reject(new Error('queue didn\'t start')), 20)
  })
})

it('Queue | Stop', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(10).callback(() => reject(new Error('queue didn\'t stop')))
    canvas.eventQ(2).stop()
    setTimeout(resolve, 20)
  })
})

it('Queue | Delayed start', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.stop(1)
    canvas.eventQ(1).pause(5).callback(() => reject(new Error('queue shouldn\'t have started')))
    canvas.pause(500).start(1)
    setTimeout(resolve, 10)
  })
})

it('Queue | Delayed stop', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.eventQ(1).pause(15).callback(() => reject(new Error('queue didn\'t stop')))
    canvas.pause(10).stop(1)
    setTimeout(resolve, 30)
  })
})

it('Queue | Cancel', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.eventQ('q1').pause(10).callback(() => reject(new Error('queue didn\'t cancel')))
    canvas.cancel('q1')
    setTimeout(resolve, 20)
  })
})

it('Queue | Cancel then start', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(10).callback(() => reject(new Error('queue didn\'t cancel')))
    canvas.eventQ(null).stop()
    canvas.pause(100)

    canvas.eventQ(null).cancel()

    canvas.pause(10).callback(resolve)
    canvas.eventQ(null).start()
    setTimeout(() => reject(new Error('queue didn\'t start')), 20)
  })
})

it('Queue | Interrupt pause', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(10).pause(100).callback(() =>
      reject(new Error('stopping the queue didn\'t invalidate the current pause')))
    canvas.eventQ(null).stop().start()

    canvas.pause(10)
    canvas.eventQ(null).cancel()

    canvas.pause(100).callback(() =>
      reject(new Error('cancelling the queue didn\'t invalidate the current pause')))
    setTimeout(resolve, 20)
  })
})
