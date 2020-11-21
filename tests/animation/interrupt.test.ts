import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv, selectNode, getNodeAttr, getNodeColor, RED, GREEN } from '../utils';

it('Animation | Interrupt', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes(['A', 'B', 'C', 'D']).add();

    canvas.node('A').duration(0).color(GREEN);
    canvas.node('A').duration(0).color(RED);

    canvas.node('B').duration(0).color(GREEN);
    canvas.node('B').duration(0.1).color(RED);

    canvas.node('C').duration(0.1).color(GREEN);
    canvas.node('C').duration(0).color(RED);

    canvas.node('D').duration(0.1).color(GREEN);
    canvas.node('D').duration(0.1).color(RED);

    return new Promise((resolve) => {
        setTimeout(() => {
            expect(getNodeColor(div, 'A')).to.eq(RED);
            expect(getNodeColor(div, 'B')).to.eq(RED);
            expect(getNodeColor(div, 'C')).to.eq(RED);
            expect(getNodeColor(div, 'D')).to.eq(RED);
            resolve();
        }, 200);
    });
});

it('Animation | Interrupt with pause', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    return new Promise((resolve) => {
        canvas.node('A').duration(0).add();

        canvas.node('A').duration(0.05).size(90);
        canvas.pause(0.025);
        canvas.node('A').duration(0.025).size(60);

        setTimeout(() => {
            expect(getNodeAttr(div, 'A', 'r')).to.eq('60');
            resolve();
        }, 70);
    });
});
