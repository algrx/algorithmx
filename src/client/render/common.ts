import { transition } from './utils';
import { D3Selection, D3SelTrans, D3Transition, getEaseFn, newTransition } from './utils';
import { ElementSpec } from '../attributes/components/element';
import {
    AttrSpec,
    EndpointValueSpec,
    DictSpec,
    PrimitiveSpec,
    StringSpec,
    BoolSpec,
    NumSpec,
} from '../attributes/spec';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { AnimAttrSpec, WithAnimSpec, AnimSpec } from '../attributes/components/animation';
import { isNum } from '../utils';

export type RenderFn<T extends AttrSpec> = (
    selection: D3SelTrans,
    value: PartialEvalAttr<T>
) => D3SelTrans;
export type RenderElementFn<T extends AttrSpec> = (
    selection: D3Selection,
    attrs: FullEvalAttr<T>,
    changes: PartialEvalAttr<T>
) => void;

export const isAnimationImmediate = <T extends AnimAttrSpec>(animAttr: PartialEvalAttr<T>) =>
    animAttr.duration === undefined || animAttr.duration === 0;

export const transAnimate = (
    trans: D3Transition,
    animAttr: PartialEvalAttr<AnimSpec>
): D3Transition => {
    if (isAnimationImmediate(animAttr)) return trans.duration(0);
    else
        return trans
            .duration(isNum(animAttr.duration) ? animAttr.duration * 1000 : 0)
            .ease(getEaseFn(animAttr.ease ?? 'poly'));
};

export const animate = (
    selection: D3Selection,
    animName: string,
    anim: PartialEvalAttr<AnimSpec>
): D3SelTrans => {
    if (isAnimationImmediate(anim)) {
        selection.interrupt(animName); // cancel previous transition
        return selection;
    } else {
        return transition(selection, animName, (t) => transAnimate(t, anim));
    }
};

interface AnimRenderInfo<T extends PartialEvalAttr<AnimAttrSpec>> {
    readonly selection: D3Selection;
    readonly animName?: string;
    readonly change?: T;
    readonly attr: T;
}

export const renderHighlightAttr = <T>(
    selection: D3Selection,
    [anim, animName]: [PartialEvalAttr<AnimSpec>, string],
    [renderIn, renderOut]: [(s: D3SelTrans) => D3SelTrans, (s: D3SelTrans) => D3SelTrans]
): D3SelTrans => {
    const highlightIn = renderIn(animate(selection, animName, anim));
    const linger = anim.linger ? anim.linger * 1000 : 0;
    return renderOut(newTransition(highlightIn, (t) => transAnimate(t.delay(linger), anim)));
};

export const renderAnimAttr = <T>(
    selection: D3Selection,
    [anim, animName]: [PartialEvalAttr<AnimSpec>, string],
    [attr, change]: [T, T | undefined],
    renderFn: (s: D3SelTrans, v: T) => D3SelTrans
): D3SelTrans => {
    if (change === undefined) return selection;

    if (anim.highlight === true) {
        const renderIn = (s: D3SelTrans) => renderFn(s, change);
        const renderOut = (s: D3SelTrans) => renderFn(s, attr);
        return renderHighlightAttr(selection, [anim, animName], [renderIn, renderOut]);
    } else return renderFn(animate(selection, animName, anim), change);
};

export const renderSvgAttr = <T extends PartialEvalAttr<AnimAttrSpec>>(
    selection: D3Selection,
    name: string | [string, string], // attrName | [attrName, animName]
    [attr, change]: [T, T | undefined],
    valueFn?: (a: NonNullable<T['value']>) => FullEvalAttr<PrimitiveSpec> | null
): D3SelTrans => {
    if (change?.value === undefined) return selection;
    const attrName = Array.isArray(name) ? name[0] : name;
    const animName = Array.isArray(name) ? name[1] : name;
    return renderAnimAttr(selection, [change, attrName], [attr, change], (s, a) => {
        const v = valueFn ? valueFn(a.value as NonNullable<T['value']>) : a.value;
        return v == null ? s.attr(attrName, null) : s.attr(attrName, String(v));
    });
};

export const renderSvgDict = (
    selection: D3Selection,
    attrs: FullEvalAttr<DictSpec<WithAnimSpec<StringSpec>>>,
    changes: PartialEvalAttr<DictSpec<WithAnimSpec<StringSpec>>>
) => {
    const select = (sel: D3Selection, k: string): [D3Selection, string] =>
        k.includes('@') ? [sel.selectAll(k.split('@')[1]), k.split('@')[0]] : [sel, k];

    Object.entries(changes).forEach(([baseKey, v]) => {
        const [s, k] = select(selection, baseKey);
        if (v.value === '') renderSvgAttr(selection, k, [attrs[k], v], (v) => null);
        // remove
        else renderSvgAttr(selection, k, [attrs[k], v]);
    });
    return selection;
};

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
    if (!isAnimationImmediate(visibleChange)) {
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

        if (visibleChange === undefined || isAnimationImmediate(visibleChange)) selection.remove();
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
