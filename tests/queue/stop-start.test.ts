import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv } from '../utils';

it('Queue | Stop', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas
            .pause(0.01)
            .message('e')
            .onmessage('e', () => reject(new Error("queue didn't stop")));
        canvas.queue().stop();
        setTimeout(resolve, 20);
    });
});

it('Queue | Start', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.withQ(1).pause(0.01).message('m').onmessage('m', resolve);
        canvas.queue(1).stop();
        canvas.queue(1).start();
        setTimeout(() => reject(new Error("queue didn't start")), 20);
    });
});

it('Queue | Clear', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.onmessage('e', () => reject(new Error("queue didn't cancel")));
        canvas.withQ('q1').pause(0.01).message('e');
        canvas.queue('q1').clear();
        setTimeout(resolve, 20);
    });
});

it('Queue | Stop then start', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.onmessage('m', resolve);

        canvas.queue('a').stop();
        canvas.withQ('a').pause(0.01).message('m');
        canvas.queue('a').start();

        setTimeout(() => reject(new Error("queue didn't start")), 20);
    });
});

it('Queue | Delayed start', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.queue(1).stop();
        canvas.onmessage('e', () => reject(new Error("queue shouldn't have started")));
        canvas.withQ(1).pause(0.005).message('e');
        canvas.withQ().pause(0.5).queue(1).start();
        setTimeout(resolve, 10);
    });
});

it('Queue | Delayed stop', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.onmessage('e', () => reject(new Error("queue didn't stop")));
        canvas.withQ(1).pause(0.015).message('e');
        canvas.withQ().pause(0.01).queue(1).stop();
        setTimeout(resolve, 30);
    });
});

it('Queue | Stop and start multiple', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve) => {
        let count = 0;
        canvas.onmessage('m', () => (count += 1));

        canvas.withQ(1).pause(0.01).message('m');
        canvas.withQ(2).pause(0.01).message('m');

        canvas.queues([1, 2]).stop();
        canvas.pause(0.02).withQ().queues([1, 2]).start();

        expect(count).to.eq(0);
        setTimeout(() => {
            expect(count).to.eq(2);
            resolve();
        }, 25);
    });
});

it('Queue | Clear multiple', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.onmessage('e1', () => reject(new Error("queue 1 wasn't cleared")));
        canvas.onmessage('e2', () => reject(new Error("queue 2 wasn't cleared")));

        canvas.withQ('q1').pause(0.01).message('e1');
        canvas.withQ('q2').pause(0.01).message('e2');

        canvas.queues(['q1', 'q2']).clear();
        setTimeout(resolve, 20);
    });
});

it('Queue | Stop then clear then start', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        canvas.onmessage('e', () => reject(new Error("queue wasn't cleared")));
        canvas.onmessage('m', resolve);

        canvas.pause(0.1).message('e');

        canvas.queue().stop().clear();

        canvas.pause(0.01).message('m');
        canvas.queue().start();
        setTimeout(() => reject(new Error("queue didn't start")), 20);
    });
});

it('Queue | Interrupt pause', () => {
    const canvas = createCanvas(createDiv());
    return new Promise((resolve, reject) => {
        let counter = 0;
        canvas.onmessage('e', () => reject(new Error('queue should be paused')));
        canvas.onmessage('m', () => (counter += 1));

        // make sure that calling 'stop' removes the current pause
        canvas.withQ(1).pause(0.1).message('m');
        canvas.queue(1).stop().start();

        // make sure that calling 'clear' removes the current pause
        canvas.withQ(2).pause(0.015).message('e');
        canvas.queue(2).clear();
        canvas.withQ(2).pause(0.015).message('m');

        setTimeout(() => {
            expect(counter).to.eq(2);
            resolve();
        }, 20);
    });
});
