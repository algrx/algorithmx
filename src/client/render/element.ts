import * as d3 from './d3.modules';
import {
    D3Selection,
    D3SelTrans,
    D3Transition,
    getEaseFn,
    transition,
    newTransition,
    animate,
    isAnimImmediate,
} from './utils';
import { ElementSpec } from '../attributes/components/element';
import { PartialEvalAttr, FullEvalAttr, PartialAttr } from '../attributes/derived';
import { AttrSpec, AttrType, AnyRecordSpec } from '../attributes/spec';
import { mapAttr } from '../attributes/utils';
import { disableAnim } from '../attributes/transform';

const animateAdd = (
    elementSel: D3Selection,
    visible: PartialEvalAttr<ElementSpec['entries']['visible']>
): D3SelTrans => {
    elementSel.attr('opacity', '0');
    const transition = animate(elementSel, 'visible-fade', visible).attr('opacity', '1');
    return newTransition(transition, (t) => t).attr('opacity', null);
};

const animateRemove = (
    elementSel: D3Selection,
    visible: PartialEvalAttr<ElementSpec['entries']['visible']>
): D3SelTrans => {
    elementSel.attr('opacity', '1');
    return animate(elementSel, 'visible-fade', visible).attr('opacity', '0');
};

const renderVisible = (
    elementSel: D3Selection,
    visibleChange: PartialEvalAttr<ElementSpec['entries']['visible']>
): D3SelTrans => {
    if (visibleChange.value === true) return animateAdd(elementSel, visibleChange);
    else return animateRemove(elementSel, visibleChange);
};

export const renderVisRemove = (
    elementSel: D3Selection,
    visibleChange: PartialEvalAttr<ElementSpec['entries']['visible']> | undefined,
    removeChange: PartialEvalAttr<ElementSpec['entries']['remove']> | undefined
) => {
    if (removeChange === true || visibleChange?.value === false) {
        renderVisible(elementSel, { ...visibleChange, value: false });

        if (visibleChange === undefined || isAnimImmediate(visibleChange)) elementSel.remove();
        else {
            transition(elementSel, 'remove', (t) =>
                t.delay((visibleChange!.duration ?? 0) * 1000)
            ).remove();
        }
    } else if (visibleChange?.value === true) {
        elementSel.interrupt('remove'); // cancel remove
        renderVisible(elementSel, visibleChange);
    }
};

export const getAllElementChanges = <T extends ElementSpec>(
    spec: T,
    attrs: FullEvalAttr<T> | undefined,
    changes: PartialEvalAttr<T>
): PartialEvalAttr<T> => {
    if (attrs !== undefined && changes.visible?.value === true) {
        // if the element is new, render everything but only animate visibility
        return {
            ...((disableAnim(spec, attrs as PartialAttr<T>) as unknown) as PartialEvalAttr<T>),
            visible: changes.visible,
        };
    }
    return changes;
};
