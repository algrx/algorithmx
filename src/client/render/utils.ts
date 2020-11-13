import * as d3 from './d3.modules';
import { BaseType, Selection, Transition, ZoomBehavior, CurveFactory } from 'd3';
import { AnimEase } from '../attributes/components/animation';
import { dashToUpperCamel } from '../utils';

export type D3Selection = Selection<any, unknown, BaseType, unknown>;
export type D3Transition = Transition<any, unknown, BaseType, unknown>;

export type D3SelTrans = D3Selection | D3Transition;
export type D3ZoomBehaviour = ZoomBehavior<Element, unknown>;

export const isTransition = (sel: D3SelTrans): sel is D3Transition =>
    (sel as D3Transition).duration !== undefined;

export const COLORS = <const>{
    navy: '#00229e',
    blue: '#2957c4',
    aqua: '#19c3d6',
    teal: '#05827d',
    olive: '#006333',
    green: '#05914d',
    lime: '#12bc6b',
    yellow: '#cc9918',
    orange: '#dd7d0f',
    red: '#af1c1c',
    pink: '#d14db0',
    fuchsia: '#bc2990',
    purple: '#a31578',
    maroon: '#7c0606',
    white: '#ffffff',
    lightgray: '#b5b5b5',
    lightgrey: '#b5b5b5',
    gray: '#969696',
    grey: '#969696',
    darkgray: '#323232',
    darkgrey: '#323232',
    black: '#111111',
};

export const parseColor = (color: string): string => {
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

export const updateTransition = (selection: D3SelTrans, callback: TransCallback): D3SelTrans => {
    if (isTransition(selection)) return callback(selection);
    else return selection;
};
