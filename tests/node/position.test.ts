import { expect } from 'chai';
import { CanvasElement } from '../../src/client/types';
import { createCanvas } from '../../src/index';
import { createDiv, getTranslation, selectNode } from '../utils';

const getPos = (div: CanvasElement, id: string | number): [number, number] => {
    return getTranslation(selectNode(div, id).attr('transform'));
};

it('Node | Position', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node(1).add().pos([-20, -20]);
    expect(getPos(div, 1)).to.eql([-20, -20]);

    canvas.node(1).pos([50, 50]);
    expect(getPos(div, 1)).to.eql([50, 50]);
});

it('Node | Position relative to canvas size', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.duration(0).size([100, 100]);

    canvas.node(1).add().pos(['-0.5cx', '0.5cy + 7']);
    expect(getPos(div, 1)).to.eql([-25, 32]);

    canvas.size([200, 300]);

    canvas.node(1).pos(['-0.5cx', '0.5cy + 7']);
    expect(getPos(div, 1)).to.eql([-50, 82]);
});
