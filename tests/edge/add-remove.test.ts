import { expect } from 'chai';
import { D3Selection } from '../../src/client/render/utils';
import { createCanvas } from '../../src/index';
import { createDiv, selectEdge, getEdgeColor, RED, GREEN } from '../utils';

it('Edge | Add', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    // not a valid edge, since nodes don't exist
    canvas.edge([1, 2]).add();
    expect(selectEdge(div, [1, 2])).to.satisfy((s: D3Selection) => s.empty());

    canvas.nodes([1, 2]).add();
    canvas.edge([1, 2]).add();

    expect(selectEdge(div, [1, 2])).to.satisfy((s: D3Selection) => !s.empty());
});

it('Edge | Add multiple edges connecting the same nodes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes(['A', 'B']).add();

    canvas
        .edges([
            ['A', 'B', 1],
            ['A', 'B', 2],
        ])
        .add();
    expect(selectEdge(div, ['A', 'B'])).to.satisfy((s: D3Selection) => s.empty());
    expect(selectEdge(div, ['A', 'B', 1])).to.satisfy((s: D3Selection) => !s.empty());
    expect(selectEdge(div, ['A', 'B', 2])).to.satisfy((s: D3Selection) => !s.empty());

    canvas
        .edges([
            ['A', 'A', 1],
            ['A', 'A', 2],
        ])
        .add();
    expect(selectEdge(div, ['A', 'A'])).to.satisfy((s: D3Selection) => s.empty());
    expect(selectEdge(div, ['A', 'A', 1])).to.satisfy((s: D3Selection) => !s.empty());
    expect(selectEdge(div, ['A', 'A', 2])).to.satisfy((s: D3Selection) => !s.empty());
});

it('Edge | Remove', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes([1, 2, 3, 4]).add();

    canvas.edge([2, 4]).add();
    canvas.edge([1, 3]).add();

    canvas.edge([1, 2]).duration(0).remove(); // no effect
    canvas.edge([2, 4]).duration(0).remove();

    expect(selectEdge(div, [1, 3])).to.satisfy((s: D3Selection) => !s.empty());
    expect(selectEdge(div, [2, 4])).to.satisfy((s: D3Selection) => s.empty());
});

it('Edge | Remove edges by removing connected node', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes(['A', 'B', 'C']).add();
    canvas
        .edges([
            ['A', 'B', 1],
            ['A', 'B', 2],
        ])
        .add();
    canvas.edges([['A', 'A']]).add();
    canvas.edges([['A', 'C']]).add();
    canvas.edges([['B', 'C']]).add();

    canvas.node('A').duration(0).remove();

    expect(selectEdge(div, ['A', 'B', 1])).to.satisfy((s: D3Selection) => s.empty());
    expect(selectEdge(div, ['A', 'B', 2])).to.satisfy((s: D3Selection) => s.empty());
    expect(selectEdge(div, ['A', 'C'])).to.satisfy((s: D3Selection) => s.empty());
    expect(selectEdge(div, ['A', 'A'])).to.satisfy((s: D3Selection) => s.empty());
    expect(selectEdge(div, ['B', 'C'])).to.satisfy((s: D3Selection) => !s.empty());
});
