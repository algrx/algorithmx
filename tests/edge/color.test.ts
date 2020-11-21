import { expect } from 'chai';
import { D3Selection } from '../../src/client/render/utils';
import { createCanvas } from '../../src/index';
import { createDiv, selectEdge, getEdgeColor, RED, GREEN } from '../utils';

it('Edge | Set color with traverse animation', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes([1, 2]).add();
    canvas
        .edges([
            [1, 2, 'a'],
            [2, 1, 'b'],
        ])
        .add();

    canvas.edge([1, 2, 'a']).duration(0.02).traverse(RED);
    canvas.edge([2, 1, 'b']).duration(0.02).traverse(RED, 1);

    expect(selectEdge(div, [1, 2, 'a']).select('.edge-path-overlay')).to.satisfy(
        (s: D3Selection) => !s.empty()
    );
    expect(selectEdge(div, [2, 1, 'b']).select('.edge-path-overlay')).to.satisfy(
        (s: D3Selection) => !s.empty()
    );

    return new Promise((resolve) => {
        setTimeout(() => {
            expect(getEdgeColor(div, [1, 2, 'a'])).to.eq(RED);
            expect(getEdgeColor(div, [2, 1, 'b'])).to.eq(RED);
            resolve();
        }, 40);
    });
});

it('Edge | Highlight color with traverse animation', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes(['A', 'B']).add();
    canvas.edge(['A', 'B']).add().directed(true).color(GREEN);

    expect(getEdgeColor(div, ['A', 'B'])).to.eq(GREEN);

    canvas.edge(['A', 'B']).duration(0).highlight(0.04).color(RED);
    expect(getEdgeColor(div, ['A', 'B'])).to.eq(RED);

    return new Promise((resolve) => {
        setTimeout(() => {
            expect(getEdgeColor(div, ['A', 'B'])).to.eq(GREEN);
            resolve();
        }, 50);
    });
});

it('Edge | Select with different (source, target) order', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes([1, 2, 'A', 'B']).add();

    canvas.edge([1, 2]).add();
    canvas.edge([2, 1]).duration(0).color(RED);
    expect(getEdgeColor(div, [1, 2])).to.eq(RED);

    canvas
        .edges([
            ['A', 'B'],
            ['B', 'A'],
        ])
        .add()
        .directed(true);

    canvas.edge(['A', 'B']).duration(0).color(RED);
    canvas.edge(['B', 'A']).duration(0).color(GREEN);
    expect(getEdgeColor(div, ['A', 'B'])).to.eq(RED);
    expect(getEdgeColor(div, ['B', 'A'])).to.eq(GREEN);
});
