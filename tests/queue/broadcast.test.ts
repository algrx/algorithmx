import { expect } from 'chai'
import * as algorithmx from '../../src/index'
import * as utils from '../utils'

it('Callback | Late', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(50).callback(resolve)
    setTimeout(() => reject(new Error('callback was too late')), 60)
  })
})

it('Callback | Early', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    canvas.pause(20).callback(() => reject(new Error('callback was too early')))
    setTimeout(resolve, 10)
  })
})

it('Callback | Variable mutation', () => {
  const canvas = algorithmx.canvas(utils.createSvg())
  return new Promise((resolve, reject) => {
    /* tslint:disable */
    let animal = 'cat'
    /* tslint:enable */
    canvas.eventQ(1).pause(40).callback(() => { animal = 'elephant' })
    canvas.eventQ(2).pause(30).callback(() => { animal = 'dog' })

    setTimeout(() => expect(animal).to.eq('cat'), 25)
    setTimeout(() => expect(animal).to.eq('dog'), 35)
    setTimeout(() => expect(animal).to.eq('elephant'), 45)
    setTimeout(resolve, 55)
    setTimeout(() => reject(new Error('callbacks didn\'t delay in parallel')), 60)
  })
})
