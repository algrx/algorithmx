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
import { PartialAttr, FullAttr } from '../attributes/derived';
import { AnimAttrSpec, WithAnimSpec, AnimSpec } from '../attributes/components/animation';
import { isNum } from '../utils';

export type RenderFn<T extends AttrSpec> = (
    selection: D3SelTrans,
    value: PartialAttr<T>
) => D3SelTrans;
export type RenderElementFn<T extends AttrSpec> = (
    selection: D3Selection,
    attrs: FullAttr<T>,
    changes: PartialAttr<T>
) => void;

export const isAnimationImmediate = <T extends AnimAttrSpec>(animation: PartialAttr<T>) =>
    animation.duration === undefined || animation.duration === 0;

export const transAnimate = (
    trans: D3Transition,
    animation: PartialAttr<AnimSpec>
): D3Transition => {
    if (isAnimationImmediate(animation)) return trans.duration(0);
    else
        return trans
            .duration(isNum(animation.duration) ? animation.duration * 1000 : 0)
            .ease(getEaseFn(animation.ease ?? 'poly'));
};

export const animate = (
    selection: D3Selection,
    name: string,
    animation: PartialAttr<AnimSpec>
): D3SelTrans => {
    if (isAnimationImmediate(animation)) {
        selection.interrupt(name); // cancel previous transition
        return selection;
    } else {
        return transition(selection, name, (t) => transAnimate(t, animation));
    }
};

export const getHighlightTrans = <T extends AnimAttrSpec>(
    selection: D3SelTrans,
    attr: PartialAttr<T>
): D3SelTrans => {
    const linger = isNum(attr.linger) ? attr.linger * 1000 : 0;
    return newTransition(selection, (t) => transAnimate(t.delay(linger), attr));
};

export const renderAnimAttr = <T extends AnimAttrSpec>(
    selection: D3Selection,
    name: string,
    changes: PartialAttr<T>,
    renderFn: (s: D3SelTrans) => D3SelTrans
): D3SelTrans => {
    const newSel = renderFn(animate(selection, name, changes));

    if (changes.highlight !== undefined) {
        const highlightTrans = getHighlightTrans(newSel, changes);
        return renderFn(animate(selection, name, changes));
    } else return newSel;
};

export const renderDict = <T extends AttrSpec>(
    attrs: FullAttr<DictSpec<T>>,
    changes: PartialAttr<DictSpec<T>> | undefined,
    renderFn: (k: string, childAttrs: FullAttr<T> | undefined, childChanges: PartialAttr<T>) => void
): void => {
    if (changes === undefined) return;
    Object.entries(changes).forEach(([k, childChanges]) => {
        renderFn(k, attrs?.[k], childChanges);
    });
};

export const renderSvgAttr = <T extends PartialAttr<AnimAttrSpec>>(
    selection: D3Selection,
    name: string | [string, string], // attrName | [attrName, animName]
    changes: T | undefined,
    valueFn: (v: NonNullable<T['value']>) => PartialAttr<PrimitiveSpec> | null = (v) =>
        v as PartialAttr<PrimitiveSpec>
): D3SelTrans => {
    if (changes === undefined || changes.value === undefined) return selection;
    const value = valueFn(changes.value as NonNullable<T['value']>);

    const attrName = Array.isArray(name) ? name[0] : name;
    const animName = Array.isArray(name) ? name[1] : name;
    return renderAnimAttr(selection, animName, changes, (sel) => {
        return value == null ? sel.attr(attrName, null) : sel.attr(attrName, String(value));
    });
};

export const renderSvgDict = (
    selection: D3Selection,
    changes: PartialAttr<DictSpec<WithAnimSpec<StringSpec>>>
) => {
    const select = (sel: D3Selection, k: string): [D3Selection, string] =>
        k.includes('@') ? [sel.selectAll(k.split('@')[1]), k.split('@')[0]] : [sel, k];

    Object.entries(changes).forEach(([baseKey, v]) => {
        const [s, k] = select(selection, baseKey);
        if (v.value === '') renderSvgAttr(s, k, v, (v) => null);
        // remove
        else renderSvgAttr(s, k, v);
    });
    return selection;
};

const animateAdd = <T extends AnimAttrSpec>(
    selection: D3Selection,
    visible: PartialAttr<ElementSpec['entries']['visible']>
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
    visible: PartialAttr<ElementSpec['entries']['visible']>
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

export const renderVisible = (
    selection: D3Selection,
    visible: PartialAttr<ElementSpec['entries']['visible']>
) => {
    if (!isAnimationImmediate(visible)) {
        if (visible.value === true) animateAdd(selection, visible);
        else animateRemove(selection, visible);
    }
};

export const renderElement = <T extends ElementSpec>(
    selection: D3Selection,
    attrs: FullAttr<T> | undefined,
    initChanges: PartialAttr<T>,
    renderFn: RenderElementFn<T>
) => {
    const changes = initChanges.visible?.value === true ? (attrs as PartialAttr<T>) : initChanges;

    if (attrs && attrs.visible?.value === true) {
        renderFn(selection, attrs, changes);
    }

    if (changes.remove === true || changes.visible?.value === false) {
        renderVisible(selection, { ...changes.visible, value: false });

        if (changes.visible === undefined || isAnimationImmediate(changes.visible))
            selection.remove();
        else {
            transition(selection, 'remove', (t) =>
                t.delay(isNum(changes.visible!.duration) ? changes.visible!.duration * 1000 : 0)
            ).remove();
        }
    } else if (changes.visible?.value === true) renderVisible(selection, changes.visible);
};
