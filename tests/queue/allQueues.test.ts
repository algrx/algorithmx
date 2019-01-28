import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Queue | Start all', () => {
  const canvas = algorithmx.canvas(utils.createDiv())
  return new Promise(resolve => {
    /* tslint:disable */
    let counter = 0;
    /* tslint:enable */
    canvas.pause(0.005).callback(() => { counter += 1 })
    canvas.eventQ(1).pause(0.005).callback(() => { counter += 1 })
    canvas.eventQ(2).pause(0.015).callback(() => { counter += 1 })
    canvas.eventQ(null).stop().stop(1).stop(2)
    canvas.eventQ(null).startall()

    setTimeout(() => {
      expect(counter).to.eq(3)
      resolve()
    }, 20)
  })
})

it('Queue | Stop all', () => {
  const canvas = algorithmx.canvas(utils.createDiv())
  return new Promise((resolve, reject) => {
    canvas.pause(0.01).callback(() => reject(new Error('queues didn\'t stop')))
    canvas.eventQ('A').pause(0.01).callback(() => reject(new Error('queues didn\'t stop')))
    canvas.eventQ('B').pause(0.01).callback(() => reject(new Error('queues didn\'t stop')))
    canvas.eventQ(null).stopall()
    setTimeout(resolve, 20)
  })
})

it('Queue | Stop all then start', () => {
  const canvas = algorithmx.canvas(utils.createDiv())
  return new Promise((resolve, reject) => {
    canvas.pause(0.02).callback(() => reject(new Error('queue didn\'t stop')))
    canvas.stopall()

    canvas.eventQ(2).pause(0.01).callback(resolve)
    canvas.eventQ(null).startall()

    setTimeout(() => reject(new Error('queue didn\'t start')), 30)
  })
})

it('Queue | Stop all then start individual', () => {
  const canvas = algorithmx.canvas(utils.createDiv())
  return new Promise((resolve, reject) => {
    canvas.stopall()

    canvas.eventQ(null).start()
    canvas.pause(0.01).callback(resolve)
    canvas.eventQ(1).callback(() => reject(new Error('queue should have been stopped')))

    setTimeout(() => reject(new Error('queue didn\'t start')), 20)
  })
})

it('Queue | Cancel all', () => {
  const canvas = algorithmx.canvas(utils.createDiv())
  return new Promise((resolve, reject) => {
    canvas.eventQ('q1').pause(0.01).callback(() => reject(new Error('queues didn\'t cancel')))
    canvas.eventQ('q2').pause(0.01).callback(() => reject(new Error('queues didn\'t cancel')))
    canvas.cancelall()
    setTimeout(resolve, 20)
  })
})
