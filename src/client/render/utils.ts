import * as d3 from './d3.modules';
import { BaseType, Selection, Transition, ZoomBehavior, CurveFactory } from 'd3';

import { AttrSpec, DictSpec, StringSpec, EndpointValueSpec } from '../attributes/spec';
import { PartialEvalAttr, FullEvalAttr } from '../attributes/derived';
import { AnimEase, AnimSpec, WithAnimSpec } from '../attributes/components/animation';
import { COLORS } from '../attributes/components/color';
import { dashToUpperCamel } from '../utils';

export type D3Selection = Selection<any, unknown, any, unknown>;
export type D3Transition = Transition<any, unknown, any, unknown>;

export type D3SelTrans = D3Selection | D3Transition;
export type D3ZoomBehaviour = ZoomBehavior<Element, unknown>;

export const isTransition = (sel: D3SelTrans): sel is D3Transition =>
    (sel as D3Transition).duration !== undefined;

export const getColor = (color: string): string => {
    const parsedColor = dashToUpperCamel(color.trim()).toLowerCase();
    if (Object.keys(COLORS).includes(parsedColor))
        return COLORS[parsedColor as keyof typeof COLORS];
    else return color;
};

export const createRenderId = (id: string): string => {
    const hash = id.split('').reduce((h, c) => {
        const newHash = (h << 5) - h + c.charCodeAt(0);
        return newHash & newHash;
    }, 0);
    return (hash >>> 0).toString(16);
};

export const selectOrAdd = (
    selection: D3Selection,
    selector: string,
    addFn: (s: D3Selection) => D3Selection
): D3Selection => {
    const selected = selection.select(selector);
    if (selected.empty()) return addFn(selection);
    else return selected as D3Selection;
};

export const getEaseFn = (name: AnimEase): ((t: number) => number) => {
    // e.g. convert 'linear' to 'easeLinear'
    return d3.ease[('ease' + dashToUpperCamel(name)) as keyof typeof d3.ease];
};

export const getCurveFn = (name: string): CurveFactory => {
    // e.g. convert 'natural' to 'curveNatural'
    return d3.shape[('curve' + dashToUpperCamel(name)) as keyof typeof d3.shape] as CurveFactory;
};

export const isSafari = (): boolean => {
    return (
        navigator &&
        navigator.userAgent !== undefined &&
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    );
};

export const isInBrowser = (): boolean => {
    return typeof window !== undefined;
};

export const canAnimate = () => {
    // only browsers support animations
    return isInBrowser();
};

type TransCallback = (trans: D3Transition) => D3Transition;
export const transition = (
    selection: D3Selection,
    name: string,
    callback: TransCallback
): D3SelTrans => {
    if (!canAnimate()) return selection;
    else return callback(selection.transition(name));
};

export const newTransition = (selection: D3SelTrans, callback: TransCallback): D3SelTrans => {
    if (!canAnimate()) return selection;
    else return callback(selection.transition());
};

export const isAnimImmediate = (animAttr: PartialEvalAttr<AnimSpec>) =>
    animAttr.duration === undefined || animAttr.duration === 0;

const transAnimate = (trans: D3Transition, animAttr: PartialEvalAttr<AnimSpec>): D3Transition => {
    if (isAnimImmediate(animAttr)) return trans.duration(0);
    else
        return trans
            .duration(animAttr.duration ? animAttr.duration * 1000 : 0)
            .ease(getEaseFn(animAttr.ease ?? 'poly'));
};

export const animate = (
    selection: D3Selection,
    animName: string,
    anim: PartialEvalAttr<AnimSpec>
): D3SelTrans => {
    if (isAnimImmediate(anim)) {
        selection.interrupt(animName); // cancel previous transition
        return selection;
    } else {
        return transition(selection, animName, (t) => transAnimate(t, anim));
    }
};

export type RenderAttrFn<T extends AttrSpec> = (
    selection: D3Selection,
    attrs: FullEvalAttr<T>,
    changes: PartialEvalAttr<T>
) => void;

export const renderWithHighlight = <T>(
    selection: D3Selection,
    [anim, animName]: [PartialEvalAttr<AnimSpec>, string],
    [renderIn, renderOut]: [(s: D3SelTrans) => D3SelTrans, (s: D3SelTrans) => D3SelTrans]
): D3SelTrans => {
    const highlightIn = renderIn(animate(selection, animName, anim));
    const linger = anim.linger ? anim.linger * 1000 : 0;
    return renderOut(newTransition(highlightIn, (t) => transAnimate(t.delay(linger), anim)));
};

export const renderWithAnim = <T>(
    selection: D3Selection,
    [anim, animName]: [PartialEvalAttr<AnimSpec>, string],
    [attr, change]: [T, T | undefined],
    renderFn: (s: D3SelTrans, v: T) => D3SelTrans
): D3SelTrans => {
    if (change === undefined) return selection;

    if (anim.highlight === true) {
        const renderIn = (s: D3SelTrans) => renderFn(s, change);
        const renderOut = (s: D3SelTrans) => renderFn(s, attr);
        return renderWithHighlight(selection, [anim, animName], [renderIn, renderOut]);
    } else return renderFn(animate(selection, animName, anim), change);
};

export const renderSvgAttr = <T extends PartialEvalAttr<WithAnimSpec<EndpointValueSpec>>>(
    selection: D3Selection,
    name: string | [string, string], // attrName | [attrName, animName]
    [attr, change]: [T, T | undefined],
    valueFn?: (a: NonNullable<T['value']>) => string | number | null
): D3SelTrans => {
    if (change?.value === undefined) return selection;
    const attrName = Array.isArray(name) ? name[0] : name;
    const animName = Array.isArray(name) ? name[1] : name;
    return renderWithAnim(selection, [change, attrName], [attr, change], (s, a) => {
        const v = valueFn ? valueFn(a.value as NonNullable<T['value']>) : a.value;
        return v == null ? s.attr(attrName, null) : s.attr(attrName, String(v));
    });
};

export const renderSvgDict = (
    selection: D3Selection,
    attrs: FullEvalAttr<DictSpec<WithAnimSpec<StringSpec>>>,
    changes: PartialEvalAttr<DictSpec<WithAnimSpec<StringSpec>>>
) => {
    const select = (s: D3Selection, k: string): [D3Selection, string] =>
        k.includes('@') ? [s.selectAll(k.split('@')[1]), k.split('@')[0]] : [s, k];

    Object.entries(changes).forEach(([baseKey, v]) => {
        const [s, k] = select(selection, baseKey);
        if (v.value === '') renderSvgAttr(selection, k, [attrs[k], v], (v) => null);
        else renderSvgAttr(selection, k, [attrs[k], v]);
    });
    return selection;
};
