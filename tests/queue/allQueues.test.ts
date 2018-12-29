import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Queue | Start all', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    /* tslint:disable */
    let counter = 0;
    /* tslint:enable */
    canvas.eventQ(1).pause(5).callback(() => { counter += 1 }).stop()
    canvas.eventQ(2).pause(10).callback(() => { counter += 1 }).stop()
    canvas.eventQ(null).start()

    setTimeout(() => {
      expect(counter).to.eq(2)
      resolve()
    }, 20)
  })
})

it('Queue | Stop all', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.eventQ('A').pause(10).callback(() => reject(new Error('queues didn\'t stop')))
    canvas.eventQ('B').pause(10).callback(() => reject(new Error('queues didn\'t stop')))
    canvas.eventQ(null).stop()
    setTimeout(resolve, 20)
  })
})

it('Queue | Stop all then start', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(20).callback(() => reject(new Error('queue didn\'t stop')))
    canvas.eventQ(null).stop()

    canvas.eventQ(2).pause(10).callback(resolve)
    canvas.eventQ(null).start()

    setTimeout(() => reject(new Error('queue didn\'t start')), 30)
  })
})

it('Queue | Cancel all', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.eventQ('q1').pause(10).callback(() => reject(new Error('queues didn\'t cancel')))
    canvas.eventQ('q2').pause(10).callback(() => reject(new Error('queues didn\'t cancel')))
    canvas.eventQ(null).cancel()
    setTimeout(resolve, 20)
  })
})
