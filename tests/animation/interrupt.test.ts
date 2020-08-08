import { expect } from 'chai';
import * as algorithmx from '../../src/index';
import * as utils from '../utils';

it('Animation | Interrupt', () => {
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

    canvas.nodes(['A', 'B', 'C', 'D']).add();

    canvas.node('A').duration(0).color(utils.GREEN);
    canvas.node('A').duration(0).color(utils.RED);

    canvas.node('B').duration(0).color(utils.GREEN);
    canvas.node('B').duration(0.1).color(utils.RED);

    canvas.node('C').duration(0.1).color(utils.GREEN);
    canvas.node('C').duration(0).color(utils.RED);

    canvas.node('D').duration(0.1).color(utils.GREEN);
    canvas.node('D').duration(0.1).color(utils.RED);

    return new Promise((resolve) => {
        setTimeout(() => {
            expect(utils.getNodeColor(div, 'A')).to.eq(utils.RED);
            expect(utils.getNodeColor(div, 'B')).to.eq(utils.RED);
            expect(utils.getNodeColor(div, 'C')).to.eq(utils.RED);
            expect(utils.getNodeColor(div, 'D')).to.eq(utils.RED);
            resolve();
        }, 200);
    });
});

it('Animation | Interrupt with pause', () => {
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

    return new Promise((resolve) => {
        canvas.node('A').duration(0).add();

        canvas.node('A').duration(0.05).size(90);
        canvas.pause(0.025);
        canvas.node('A').duration(0.025).size(60);

        setTimeout(() => {
            expect(utils.getNodeAttr(div, 'A', 'r')).to.eq('60');
            resolve();
        }, 70);
    });
});
