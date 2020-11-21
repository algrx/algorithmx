import { expect } from 'chai';
import { D3Selection } from '../../src/client/render/utils';
import { createCanvas } from '../../src/index';
import { createDiv, selectNode, selectNodeLabel, getLabelAttr, RED, GREEN } from '../utils';

it('Label | Set attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node(1).add().label(1).add();

    canvas
        .node(1)
        .label(1)
        .duration(0)
        .attrs({
            size: 20,
            svgattrs: {
                stroke: GREEN,
                'text-decoration': 'underline',
            },
        });

    const labelSel = selectNodeLabel(selectNode(div, 1), 1);
    expect(getLabelAttr(labelSel, 'font-size')).to.eq('20');
    expect(getLabelAttr(labelSel, 'stroke')).to.eq(GREEN);
    expect(getLabelAttr(labelSel, 'text-decoration')).to.eq('underline');
});

it('Label | Set color from data', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.nodes([1, 2]).add().labels([1, 2]).add();

    canvas
        .nodes([1, 2])
        .data([RED, GREEN])
        .labels([1, 2])
        .duration(0)
        .color((d) => d);

    expect(getLabelAttr(selectNodeLabel(selectNode(div, 1), 1), 'fill')).to.eq(RED);
    expect(getLabelAttr(selectNodeLabel(selectNode(div, 1), 2), 'fill')).to.eq(RED);
    expect(getLabelAttr(selectNodeLabel(selectNode(div, 2), 1), 'fill')).to.eq(GREEN);
    expect(getLabelAttr(selectNodeLabel(selectNode(div, 2), 2), 'fill')).to.eq(GREEN);

    canvas
        .nodes([1, 2])
        .labels([1, 2])
        .data([RED, GREEN])
        .duration(0)
        .color((d) => d);

    expect(getLabelAttr(selectNodeLabel(selectNode(div, 1), 1), 'fill')).to.eq(RED);
    expect(getLabelAttr(selectNodeLabel(selectNode(div, 1), 2), 'fill')).to.eq(GREEN);
    expect(getLabelAttr(selectNodeLabel(selectNode(div, 2), 1), 'fill')).to.eq(RED);
    expect(getLabelAttr(selectNodeLabel(selectNode(div, 2), 2), 'fill')).to.eq(GREEN);
});

it('Label | Set SVG attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.node(1).add();

    canvas
        .node(1)
        .label()
        .duration(0)
        .svgattr('stroke', RED)
        .svgattr('text-decoration', 'line-through');

    const labelSel = selectNodeLabel(selectNode(div, 1), 0);
    expect(getLabelAttr(labelSel, 'stroke')).to.eq(RED);
    expect(getLabelAttr(labelSel, 'text-decoration')).to.eq('line-through');
});
