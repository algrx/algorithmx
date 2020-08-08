import { expect } from 'chai';
import * as algorithmx from '../../src/index';
import * as utils from '../utils';

it('Canvas | Setting SVG attributes', () => {
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

    canvas.duration(0).svgattr('opacity', '0.5');
    expect(utils.selectCanvas(div).attr('opacity')).to.eq('0.5');
});

it('Node | Setting SVG attributes', () => {
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

    canvas.node(1).add().svgattr('stroke', utils.RED).svgattr('stroke-width', 4);
    expect(utils.getNodeAttr(div, 1, 'stroke')).to.eq(utils.RED);
    expect(utils.getNodeAttr(div, 1, 'stroke-width')).to.eq('4');

    canvas.node(1).duration(0).svgattr('stroke', null);
    expect(utils.getNodeAttr(div, 1, 'stroke')).to.eq(null);
});

it('Edge | Setting SVG attributes', () => {
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

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

    expect(utils.getEdgeAttr(div, [1, 2], 'stroke-dasharray')).to.eq('7');
    expect(utils.getEdgeAttr(div, [1, 3], 'stroke-dasharray')).to.eq('8');
});

it('Label | Setting SVG as CSS attributes', () => {
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

    canvas.node(1).add();

    canvas
        .node(1)
        .label()
        .duration(0)
        .svgattr('stroke', utils.RED)
        .svgattr('text-decoration', 'line-through');

    const labelSel = utils.selectNodeLabel(utils.selectNode(div, 1), 'value');
    expect(utils.getLabelAttr(labelSel, 'stroke')).to.eq(utils.RED);
    expect(utils.getLabelAttr(labelSel, 'text-decoration')).to.eq('line-through');
});

it('Node | Highlighting SVG attributes', () => {
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

    canvas.node(1).add().svgattr('stroke', utils.RED);

    canvas.node(1).duration(0).highlight(0.03).svgattr('stroke', utils.GREEN);
    expect(utils.getNodeAttr(div, 1, 'stroke')).to.eq(utils.GREEN);

    return new Promise((resolve) => {
        setTimeout(() => {
            expect(utils.getNodeAttr(div, 1, 'stroke')).to.satisfy(
                (s: string) => utils.removeSpaces(s) === utils.RED
            );
            resolve();
        }, 50);
    });
});
