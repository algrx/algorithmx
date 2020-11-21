import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv } from '../utils';

it('Queue | Start all', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve) => {
        let counter = 0;
        canvas
            .pause(0.005)
            .onmessage('m1', () => {
                counter += 1;
            })
            .message('m1');
        canvas
            .withQ(1)
            .pause(0.005)
            .onmessage('m2', () => {
                counter += 1;
            })
            .message('m2');
        canvas
            .withQ(2)
            .pause(0.015)
            .onmessage('m3', () => {
                counter += 1;
            })
            .message('m3');
        canvas.queues([1, 2]).stop();
        canvas.queues().start();

        setTimeout(() => {
            expect(counter).to.eq(3);
            resolve();
        }, 20);
    });
});

it('Queue | Stop all', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.pause(0.01).message('e');
        canvas.withQ('A').pause(0.01).message('e');
        canvas.withQ('B').pause(0.01).message('e');

        canvas.onmessage('e', () => reject(new Error("queues didn't stop")));
        canvas.queues().stop();
        setTimeout(resolve, 20);
    });
});

it('Queue | Stop all then start', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        let counter = 0;
        canvas.onmessage('m', () => (counter += 1));

        canvas.withQ(1).pause(0.01).message('m');
        canvas.withQ(2).pause(0.01).message('m');
        canvas.queues().stop();

        setTimeout(() => {
            expect(counter).to.eq(0);
            canvas.queues().start();
            setTimeout(() => {
                expect(counter).to.eq(2);
                resolve();
            }, 20);
        }, 20);
    });
});

it('Queue | Clear all', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.withQ('q1').pause(0.01).message('e');
        canvas.withQ('q2').pause(0.01).message('e');

        canvas.onmessage('e', () => reject(new Error("queues weren't cleared")));
        canvas.queues().clear();
        setTimeout(resolve, 20);
    });
});
