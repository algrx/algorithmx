import { expect } from 'chai';
import { D3Selection } from '../../src/client/render/utils';
import { createCanvas } from '../../src/index';
import { createDiv, selectCanvas } from '../utils';

it('Canvas | Add and remove', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty());

    canvas.duration(0).node('A').add();
    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty());

    canvas.duration(0).remove();
    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty());

    canvas.duration(0).add();
    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty());
});

it('Canvas | Remove multiple times', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.duration(0).remove();

    canvas.duration(0).node('A').add();
    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty());

    canvas.duration(0).remove();
    canvas.duration(0).remove();
    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty());
});

it('Canvas | Visibility', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.duration(0).remove();
    canvas.duration(0).nodes([1, 2, 3, 4]).add();
    canvas
        .duration(0)
        .edges([
            [1, 3],
            [1, 4],
            [2, 4],
            [2, 3],
        ])
        .add();

    canvas.duration(0).visible(false);
    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => s.empty());

    canvas.visible(true);
    expect(selectCanvas(div).select('g')).to.satisfy((s: D3Selection) => !s.empty());
});
