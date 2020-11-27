import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv, getEdgeAttr, getEdgeColor, RED, GREEN } from '../utils';

it('Edge | Set attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes([1, 2]).add();

    const edges: ReadonlyArray<[number, number, string]> = [
        [1, 2, 'a'],
        [2, 1, 'b'],
    ];
    canvas.edges(edges).add();

    canvas
        .edges(edges)
        .duration(0)
        .attrs({
            color: (e) => (e[2] === 'a' ? GREEN : RED),
            thickness: 5,
        });

    expect(getEdgeColor(div, edges[0])).to.eq(GREEN);
    expect(getEdgeColor(div, edges[1])).to.eq(RED);
    expect(getEdgeAttr(div, edges[1], 'stroke-width')).to.eq('5');
});

it('Edge | Set SVG attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes([1, 2, 3]).add();
    canvas
        .edges([
            [1, 2],
            [1, 3],
        ])
        .add();

    canvas
        .edges([
            [1, 2],
            [1, 3],
        ])
        .duration(0)
        .svgattr('stroke-dasharray', (edge: [number, number]) => (edge[1] === 2 ? 7 : 8));

    expect(getEdgeAttr(div, [1, 2], 'stroke-dasharray')).to.eq('7');
    expect(getEdgeAttr(div, [1, 3], 'stroke-dasharray')).to.eq('8');
});
