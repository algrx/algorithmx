import { expect } from 'chai';
import { D3Selection } from '../../src/client/render/utils';
import { createCanvas } from '../../src/index';
import { createDiv, getTranslation, selectNode, selectNodeLabel } from '../utils';

const getPos = (label: D3Selection): [number, number] => {
    return getTranslation(label.attr('transform'));
};

it('Label (Node) | Position in corner using expressions', () => {
    createDiv();
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas
        .node('A')
        .duration(0)
        .add()
        .size(10)
        .label(1)
        .add()
        .radius(0)
        .align('top-right')
        .pos(['0.8x', '0.8y']);

    const labelSel = selectNodeLabel(selectNode(div, 'A'), 1);

    expect(getPos(labelSel)).to.eql([8, 8]);

    canvas.node('A').duration(0).size('4x');
    expect(getPos(labelSel)).to.eql([32, 32]);
});
