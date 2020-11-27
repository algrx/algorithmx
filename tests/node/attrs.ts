import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv, removeSpaces, getNodeAttr, getNodeColor, RED, GREEN } from '../utils';

it('Node | Set attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node(1).add().size(40);
    canvas.node(1).duration(0).attrs({
        color: RED,
        size: '2x',
    });

    expect(getNodeColor(div, 1)).to.eql(RED);
    expect(getNodeAttr(div, 1, 'r')).to.eql('80');
});

it('Node | Set SVG attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node(1).add().svgattr('stroke', RED).svgattr('stroke-width', 4);
    expect(getNodeAttr(div, 1, 'stroke')).to.eq(RED);
    expect(getNodeAttr(div, 1, 'stroke-width')).to.eq('4');

    canvas.node(1).duration(0).svgattr('stroke', '');
    expect(getNodeAttr(div, 1, 'stroke')).to.eq(null);
});

it('Node | Highlight attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    const expectNormal = () => {
        expect(getNodeAttr(div, 1, 'r')).to.eq('40');
        expect(getNodeAttr(div, 1, 'stroke')).to.satisfy((s: string) => removeSpaces(s) === RED);
        expect(getNodeAttr(div, 1, 'stroke-width')).to.eq('2');
        expect(getNodeColor(div, 1)).to.eq(GREEN);
    };

    const expectHighlight = () => {
        expect(getNodeAttr(div, 1, 'r')).to.eq('20');
        expect(getNodeAttr(div, 1, 'stroke')).to.satisfy((s: string) => removeSpaces(s) === GREEN);
        expect(getNodeAttr(div, 1, 'stroke-width')).to.eq('4');
        expect(getNodeColor(div, 1)).to.eq(RED);
    };

    canvas.node(1).add().size(40).color(GREEN).svgattr('stroke', RED).svgattr('stroke-width', 2);
    expectNormal();

    canvas
        .node(1)
        .duration(0)
        .highlight(0.03)
        .attrs({
            size: '0.5x',
            color: RED,
            svgattrs: {
                stroke: GREEN,
                'stroke-width': 4,
            },
        });
    expectHighlight();

    return new Promise((resolve) => {
        setTimeout(() => {
            expectNormal();
            resolve();
        }, 50);
    });
});

it('Node | Highlight color', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node('A').add().color(GREEN);
    expect(getNodeColor(div, 'A')).to.eq(GREEN);

    canvas.node('A').duration(0).highlight(0.03).color(RED);
    expect(getNodeColor(div, 'A')).to.eq(RED);

    return new Promise((resolve) => {
        setTimeout(() => {
            expect(getNodeColor(div, 'A')).to.eq(GREEN);
            resolve();
        }, 50);
    });
});

it('Node | Highlight size using expression', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node('A').add().size(20);
    expect(getNodeAttr(div, 'A', 'r')).to.eq('20');

    canvas.node('A').duration(0).highlight(0.03).size('1.5x');
    expect(getNodeAttr(div, 'A', 'r')).to.eq('30');

    return new Promise((resolve) => {
        setTimeout(() => {
            expect(getNodeAttr(div, 'A', 'r')).to.eq('20');
            resolve();
        }, 50);
    });
});
