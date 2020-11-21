import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv, getNodeAttr, getNodeColor, RED, GREEN } from '../utils';

const DELAY = 50;
const DELTA = 10;

it('Queue | Pause in series', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    return new Promise((resolve) => {
        const nodes = [1, 2, 3];
        canvas.nodes(nodes).duration(0).add().color(RED);
        canvas
            .pause(DELAY / 1000)
            .node(nodes[0])
            .duration(0)
            .color(GREEN);
        canvas
            .pause(DELAY / 1000)
            .node(nodes[1])
            .duration(0)
            .color(GREEN);
        canvas
            .pause(DELAY / 1000)
            .node(nodes[2])
            .duration(0)
            .color(GREEN);
        const getNodeColors = () => nodes.map((n) => getNodeColor(div, n));

        setTimeout(() => expect(getNodeColors()).to.eql([RED, RED, RED]), DELAY - DELTA);
        setTimeout(() => expect(getNodeColors()).to.eql([GREEN, RED, RED]), 2 * DELAY - DELTA);
        setTimeout(() => expect(getNodeColors()).to.eql([GREEN, GREEN, RED]), 3 * DELAY - DELTA);
        setTimeout(() => expect(getNodeColors()).to.eql([GREEN, GREEN, GREEN]), 4 * DELAY - DELTA);
        setTimeout(resolve, 4 * DELAY);
    });
});

it('Queue | Pause in parallel', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    return new Promise((resolve) => {
        const nodes: ReadonlyArray<string> = ['A', 'B', 'C'];
        canvas.nodes(nodes).duration(0).add().size(25);
        canvas
            .withQ(null)
            .pause(DELAY / 1000)
            .duration(0)
            .node(nodes[0])
            .size(40);
        canvas
            .withQ('q1')
            .pause(DELAY / 1000)
            .duration(0)
            .node(nodes[1])
            .size(40);
        canvas
            .withQ('q2')
            .pause(DELAY / 1000)
            .duration(0)
            .node(nodes[2])
            .size(40);
        const getNodeSizes = () => nodes.map((n) => getNodeAttr(div, n, 'r'));

        setTimeout(() => expect(getNodeSizes()).to.eql(['40', '25', '25']), DELAY - DELTA);
        setTimeout(() => expect(getNodeSizes()).to.eql(['40', '40', '40']), 2 * DELAY - DELTA);
        setTimeout(resolve, 2 * DELAY);
    });
});
