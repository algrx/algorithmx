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
): void => {
    elementSel.attr('opacity', '0');
    const transition = animate(elementSel, 'visible-fade', visible).attr('opacity', '1');
    newTransition(transition, (t) => t).attr('opacity', null);
};

const animateRemove = (
    elementSel: D3Selection,
    visible: PartialEvalAttr<ElementSpec['entries']['visible']>
): void => {
    elementSel.attr('opacity', '1');
    const transition = animate(elementSel, 'visible-fade', visible).attr('opacity', '0');
};

const renderVisible = (
    selection: D3Selection,
    visibleChange: PartialEvalAttr<ElementSpec['entries']['visible']>
) => {
    if (!isAnimImmediate(visibleChange)) {
        if (visibleChange.value === true) animateAdd(selection, visibleChange);
        else animateRemove(selection, visibleChange);
    }
};

export const renderVisRemove = (
    selection: D3Selection,
    visibleChange: PartialEvalAttr<ElementSpec['entries']['visible']> | undefined,
    removeChange: PartialEvalAttr<ElementSpec['entries']['remove']> | undefined
) => {
    if (removeChange === true || visibleChange?.value === false) {
        renderVisible(selection, { ...visibleChange, value: false });

        if (visibleChange === undefined || isAnimImmediate(visibleChange)) selection.remove();
        else {
            transition(selection, 'remove', (t) =>
                t.delay((visibleChange!.duration ?? 0) * 1000)
            ).remove();
        }
    } else if (visibleChange?.value === true) renderVisible(selection, visibleChange);
};

export const getAllElementChanges = <T extends ElementSpec>(
    spec: T,
    attrs: FullEvalAttr<T> | undefined,
    changes: PartialEvalAttr<T>
): PartialEvalAttr<T> => {
    if (changes.visible?.value === true) {
        // if the element is new, render everything but only animate visibility
        return {
            ...((disableAnim(spec, attrs as PartialAttr<T>) as unknown) as PartialEvalAttr<T>),
            visible: changes.visible,
        };
    }
    return changes;
};
