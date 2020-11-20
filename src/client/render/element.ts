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
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { AnimAttrSpec, WithAnimSpec, AnimSpec } from '../attributes/components/animation';

const animateAdd = <T extends AnimAttrSpec>(
    selection: D3Selection,
    visible: PartialEvalAttr<ElementSpec['entries']['visible']>
): void => {
    if (visible.animtype === 'fade') {
        selection.attr('opacity', '0');
        const transition = animate(selection, 'visible-fade', visible).attr('opacity', '1');
        newTransition(transition, (t) => t).attr('opacity', null);
    } else if (visible.animtype === 'scale') {
        selection.attr('transform', 'scale(0,0)');
        const transition = animate(selection, 'visible-fade', visible).attr(
            'transform',
            'scale(1,1)'
        );
        newTransition(transition, (t) => t).attr('transform', null);
    }
};

const animateRemove = <T extends AnimAttrSpec>(
    selection: D3Selection,
    visible: PartialEvalAttr<ElementSpec['entries']['visible']>
): void => {
    if (visible.animtype === 'fade') {
        selection.attr('opacity', '1');
        const transition = animate(selection, 'visible-fade', visible).attr('opacity', '0');
    } else if (visible.animtype === 'scale') {
        selection.attr('transform', 'scale(1,1)');
        const transition = animate(selection, 'visible-fade', visible).attr(
            'transform',
            'scale(0,0)'
        );
    }
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
    initChanges: PartialEvalAttr<T>
): PartialEvalAttr<T> => {
    return initChanges.visible?.value === true ? (attrs as PartialEvalAttr<T>) : initChanges;
};
