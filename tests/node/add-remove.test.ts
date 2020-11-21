import { expect } from 'chai';
import { D3Selection } from '../../src/client/render/utils';
import { createCanvas } from '../../src/index';
import { createDiv, selectNode, getNodeColor, RED } from '../utils';

it('Node | Add', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node('A').add();
    expect(selectNode(div, 'A')).to.satisfy((s: D3Selection) => !s.empty());
});

it('Node | Remove', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes(['A', 'B', 'C']).add();

    canvas.node('B').duration(0).remove();
    expect(selectNode(div, 'B')).to.satisfy((s: D3Selection) => s.empty());
});

it('Node | Remove all', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes([1, 2]).add();

    canvas.nodes().duration(0).remove();
    expect(selectNode(div, 1)).to.satisfy((s: D3Selection) => s.empty());
    expect(selectNode(div, 2)).to.satisfy((s: D3Selection) => s.empty());
});

it('Node | Add then remove then add', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node(1).add();

    canvas.node(1).duration(0).remove();
    expect(selectNode(div, 1)).to.satisfy((s: D3Selection) => s.empty());

    canvas.node(1).duration(0).add();
    expect(selectNode(div, 1)).to.satisfy((s: D3Selection) => !s.empty());
});

it('Node | Visibility', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node(1).add().color(RED);

    canvas.node(1).duration(0).visible(false);
    expect(selectNode(div, 1)).to.satisfy((s: D3Selection) => s.selectChild().empty());

    canvas.node(1).duration(0).visible(true);
    expect(getNodeColor(div, 1)).to.eq(RED);
});
