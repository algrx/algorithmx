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
    renderSvgDict,
    renderSvgAttr,
    renderVisRemove,
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

    const anim = changes.pos ?? changes.radius ?? changes.angle ?? {};
    renderAnimAttr(textSel, [anim, 'pos'], [attrs, changes], (s, a) => {
        const angle = a.angle?.value ?? attrs.angle.value;
        const radius = a.radius?.value ?? attrs.radius.value;
        const pos = a.pos?.value ?? attrs.pos.value;
        const angleRad = angleToRad(angle);
        const align = getExactAlign(angle, attrs.rotate, attrs.align);

        const polarX = radius * Math.cos(angleRad);
        const polarY = radius * Math.sin(angleRad);

        const rotation = restrictAngle(-angleRad + ALIGN_ANGLES[align] + Math.PI);
        const rotateStr = attrs.rotate ? `rotate(${angleToDeg(rotation)})` : '';

        return s.attr(
            'transform',
            `translate(${pos[0] + polarX},${-(pos[1] + polarY)})${rotateStr}`
        );
    });
};

const LINE_HEIGHT = 1.2;

const isAlignTop = (a: LabelAlign) => a === 'top-left' || a === 'top-middle' || a === 'top-right';
const isAlignBottom = (a: LabelAlign) =>
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

    const anim = attrs.align === 'radial' ? changes.radius ?? changes.angle ?? {} : {};

    renderAnimAttr(textSel, [anim, 'align'], [attrs, changes], (s, a) => {
        const align = getExactAlign(a.angle?.value ?? attrs.angle.value, attrs.rotate, attrs.align);

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

    renderAnimAttr(textSel.select('tspan'), [anim, 'align-text'], [attrs, changes], (s, a) => {
        const align = getExactAlign(a.angle?.value ?? attrs.angle.value, attrs.rotate, attrs.align);
        const numTextLines = attrs.text.split('\n').length;
        const textOffset = isAlignTop(align)
            ? 0
            : isAlignBottom(align)
            ? (numTextLines - 1) * LINE_HEIGHT
            : ((numTextLines - 1) / 2) * LINE_HEIGHT;

        return s.attr('dy', `-${textOffset}em`);
    });
};

const renderText = (textSel: D3Selection, text: string) => {
    const splitText = text.split('\n');
    textSel.selectAll('tspan').remove();

    splitText.forEach((line, i) => {
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

    renderSvgAttr(textSel, 'fill', [attrs.color, changes.color], (v) => parseColor(v));
    if (changes.font) textSel.attr('font-family', changes.font);
    renderSvgAttr(textSel, 'font-size', [attrs.size, changes.size]);

    if (changes.svgattrs) renderSvgDict(textSel, attrs.svgattrs, changes.svgattrs);
};

export const renderLabel = (
    labelSel: D3Selection,
    attrs: FullEvalAttr<LabelSpec> | undefined,
    changes: PartialEvalAttr<LabelSpec>
) => {
    renderVisRemove(labelSel, changes.visible, changes.remove);
    if (attrs?.visible.value === true) renderLabelAttrs(labelSel, attrs, changes);
};
