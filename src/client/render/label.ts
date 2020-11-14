import * as d3 from './d3.modules';
import {
    LabelSpec,
    LabelAlign,
    labelSpec,
    ALIGN_ANGLES,
    alignFromAngle,
} from '../attributes/components/label';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import {
    RenderElementFn,
    renderAnimAttr,
    renderDict,
    renderSvgDict,
    renderSvgAttr,
    renderElement,
} from './common';
import { D3Selection, D3SelTrans, selectOrAdd, createRenderId, parseColor } from './utils';
import { selectInnerCanvas, selectEdge, selectEdgeGroup } from './selectors';
import { angleToRad, restrictAngle, angleToDeg } from '../math';
import { AnimSpec } from '../attributes/components/animation';
import { combineAttrs } from '../attributes/utils';

const getExactAlign = (angle: number, rotate: boolean, align: LabelAlign): LabelAlign => {
    if (align === 'radial') return alignFromAngle(angleToRad(angle), rotate);
    else return align;
};

const renderPos = (
    textSel: D3Selection,
    attrs: FullEvalAttr<LabelSpec>,
    changes: PartialEvalAttr<LabelSpec>
) => {
    if (
        !(
            changes.pos ||
            changes.radius ||
            changes.angle ||
            changes.rotate !== undefined ||
            changes.align !== undefined
        )
    )
        return;

    const angle = changes.angle?.value ?? attrs.angle.value;
    const radius = changes.radius?.value ?? attrs.radius.value;
    const pos = changes.pos?.value ?? attrs.pos.value;
    const angleRad = angleToRad(angle);
    const align = getExactAlign(angle, attrs.rotate, attrs.align);

    const polarX = radius * Math.cos(angleRad);
    const polarY = radius * Math.sin(angleRad);

    const rotation = restrictAngle(-angleRad + ALIGN_ANGLES[align] + Math.PI);
    const rotateStr = attrs.rotate ? `rotate(${angleToDeg(rotation)})` : '';

    const anim = changes.pos ?? changes.radius ?? changes.angle ?? {};
    //console.log(anim);
    renderAnimAttr(textSel, 'pos', anim, (s) => {
        return s.attr(
            'transform',
            `translate(${pos[0] + polarX},${-(pos[1] + polarY)})${rotateStr}`
        );
    });
};

const LINE_HEIGHT = 1.2;

const isAlignTop = (a: LabelAlign): boolean =>
    a === 'top-left' || a === 'top-middle' || a === 'top-right';
const isAlignBottom = (a: LabelAlign): boolean =>
    a === 'bottom-left' || a === 'bottom-middle' || a === 'bottom-right';

const renderAlign = (
    textSel: D3Selection,
    attrs: FullEvalAttr<LabelSpec>,
    changes: PartialEvalAttr<LabelSpec>
) => {
    if (
        changes.align === undefined &&
        (attrs.align !== 'radial' || !(changes.radius || changes.angle))
    )
        return;

    const align = getExactAlign(
        changes.angle?.value ?? attrs.angle.value,
        attrs.rotate,
        attrs.align
    );
    const anim = attrs.align === 'radial' ? changes.radius ?? changes.angle ?? {} : {};
    console.log(align);

    renderAnimAttr(textSel, 'align', anim, (s) => {
        return s
            .attr('y', isAlignTop(align) ? '0.75em' : isAlignBottom(align) ? '0em' : '0.25em')
            .attr(
                'text-anchor',
                align === 'top-left' || align === 'middle-left' || align === 'bottom-left'
                    ? 'start'
                    : align === 'top-right' || align === 'middle-right' || align === 'bottom-right'
                    ? 'end'
                    : 'middle'
            );
    });

    const numTextLines = attrs.text.split('\n').length;
    const textOffset = isAlignTop(align)
        ? 0
        : isAlignBottom(align)
        ? (numTextLines - 1) * LINE_HEIGHT
        : ((numTextLines - 1) / 2) * LINE_HEIGHT;

    renderAnimAttr(textSel.select('tspan'), 'align-text', anim, (s) => {
        return s.attr('dy', `-${textOffset}em`);
    });
};

const renderText = (textSel: D3Selection, text: string) => {
    const splitText = text.split('\n');
    textSel.selectAll('tspan').remove();

    splitText.forEach((line, i) => {
        /*
        const initOffset = isAlignTop(align)
            ? 0
            : isAlignBottom(align)
            ? (splitText.length - 1) * lineHeight
            : ((splitText.length - 1) / 2) * lineHeight;

        .attr('dy', i === 0 ? `-${initOffset}em` : `${lineHeight}em`)
        */
        textSel
            .append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? '0em' : `${LINE_HEIGHT}em`)
            .text(line);
    });
};

const renderLabelAttrs: RenderElementFn<LabelSpec> = (labelSel, attrs, changes) => {
    const textSel = selectOrAdd(labelSel, 'text', (s) =>
        s.append('text').attr('pointer-events', 'none')
    );

    if (changes.text !== undefined) renderText(textSel, changes.text);
    renderPos(textSel, attrs, changes);
    renderAlign(textSel, attrs, changes);

    renderSvgAttr(textSel, 'fill', changes.color, (v) => parseColor(v));
    if (changes.font) textSel.attr('font-family', changes.font);
    renderSvgAttr(textSel, 'font-size', changes.size);

    if (changes.svgattrs) renderSvgDict(textSel, changes.svgattrs);
};

export const renderLabel = (
    labelSel: D3Selection,
    attrs: FullEvalAttr<LabelSpec> | undefined,
    changes: PartialEvalAttr<LabelSpec>
) => {
    renderElement(labelSel, attrs, changes, renderLabelAttrs);
};
