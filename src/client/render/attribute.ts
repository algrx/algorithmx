import { AnimSpec, WithAnimSpec } from '../attributes/components/animation';
import { AttrSpec, EndpointValueSpec } from '../attributes/spec';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { D3Selection, D3Transition, D3SelTrans, isInBrowser, isTransition, easeFn } from './utils';
import { isNum } from '../utils';

type AnimAttrSpec = WithAnimSpec<EndpointValueSpec>;

export type RenderFn<T extends AttrSpec> = (
    selection: D3SelTrans,
    value: PartialAttr<T>
) => D3SelTrans;
export type RenderElementFn<T extends AttrSpec> = (
    selection: D3Selection,
    attrs: FullAttr<T>,
    changes: PartialAttr<T>
) => void;

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

export const updateTransition = (selection: D3SelTrans, callback: TransCallback): D3SelTrans => {
    if (isTransition(selection)) return callback(selection);
    else return selection;
};

export const parseTime = (time: number): number => {
    return time * 1000;
};

export const isAnimationImmediate = <T extends AnimAttrSpec>(animation: PartialAttr<T>) =>
    animation.duration === undefined || animation.duration === 0;

export const transAnimate = (
    trans: D3Transition,
    animation: PartialAttr<AnimSpec>
): D3Transition => {
    if (isAnimationImmediate(animation)) return trans.duration(0);
    else
        return trans
            .duration(parseTime(isNum(animation.duration) ? animation.duration : 0))
            .ease(easeFn(animation.ease ?? 'poly'));
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

/*
export const onChanged = <T extends Attr>(
    selection: D3Selection,
    renderData: RenderEndpoint<T>,
    callback: (s: D3Selection, d: RenderEndpoint<T>) => void
): void => {
    if (renderProcess.hasChanged(renderData)) callback(selection, renderData);
};
*/

export const getHighlightTrans = <T extends AnimAttrSpec>(
    selection: D3SelTrans,
    attr: PartialAttr<T>
): D3SelTrans => {
    const linger = isNum(attr.linger) ? parseTime(attr.linger) : 0;
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

/*
export const renderNoHighlight = <T extends Attr>(
    selection: D3Selection,
    renderData: RenderEndpoint<T>,
    renderFn: RenderFn<T>
): D3SelTrans => {
    if (renderData.changes !== undefined) {
        return renderFn(animate(selection, renderData.name, renderData.animation), renderData.attr);
    } else return selection;
};
*/

/*
export const renderLookup = <T extends AttrSpec>(
    attr: PartialAttr<DictSpec<T>>,
    renderFn: (k: string, attr: PartialAttr<T>) => void,
): void => {
    Object.entries(renderData.attr).forEach(([k, v]) => {
        const entry = renderProcess.getEntry<AttrLookup<T>, string>(renderData, k);
        if (v !== null && renderProcess.hasChanged(entry)) renderFn(k, entry);
    });
};

export const renderLookupRemovals = <T extends Attr>(
    attr: RenderAttr<AttrLookup<T>>,
    renderFn: (k: string, attr: PartialAttr<T>) => void,
): void => {
    Object.entries(renderData.changes || {}).forEach(([k, v]) => {
        const entry = renderProcess.getEntry<AttrLookup<T>, string>(renderData, k);
        if (v === null) renderFn(k, entry);
    });
};
*/
