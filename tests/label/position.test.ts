import { expect } from 'chai';
import { D3Selection } from '../../src/client/render/utils';
import * as algorithmx from '../../src/index';
import * as utils from '../utils';

const getPos = (label: D3Selection): [number, number] => {
    return utils.getTranslation(utils.getLabelAttr(label, 'transform'));
};

it('Label (node) | Position in corner using expressions', () => {
    utils.createDiv();
    const div = utils.createDiv();
    const canvas = algorithmx.canvas(div);

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

    const labelSel = utils.selectNodeLabel(utils.selectNode(div, 'A'), 1);

    expect(getPos(labelSel)).to.eql([8, 8]);

    canvas.node('A').duration(0).size('4x');
    expect(getPos(labelSel)).to.eql([32, 32]);
});
