import { expect } from 'chai';
import { createCanvas } from '../../src/index';
import { createDiv, selectCanvas } from '../utils';

it('Canvas | Set SVG attributes', () => {
    const div = createDiv();
    const canvas = createCanvas(div);

    canvas.duration(0).svgattr('opacity', '0.5');
    expect(selectCanvas(div).attr('opacity')).to.eq('0.5');
});
