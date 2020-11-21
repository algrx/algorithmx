import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv } from '../utils';

it('Message | Late', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.onmessage('m', resolve);
        canvas.pause(0.05).message('m');
        setTimeout(() => reject(new Error('message was too late')), 60);
    });
});

it('Message | Early', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.onmessage('e', () => reject(new Error('message was too early')));
        canvas.pause(0.02).message('e');
        setTimeout(resolve, 10);
    });
});

it('Message | Parallel', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        let animal = 'cat';
        canvas
            .withQ(1)
            .pause(0.04)
            .onmessage('m1', () => {
                animal = 'elephant';
            })
            .message('m1');
        canvas
            .withQ(2)
            .pause(0.03)
            .onmessage('m2', () => {
                animal = 'dog';
            })
            .message('m2');

        setTimeout(() => expect(animal).to.eq('cat'), 25);
        setTimeout(() => expect(animal).to.eq('dog'), 35);
        setTimeout(() => expect(animal).to.eq('elephant'), 45);
        setTimeout(resolve, 55);
    });
});
