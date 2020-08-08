import { AnimationFull } from '../attributes/definitions/animation';
import { ICanvasAttr, definition as canvasDef } from '../attributes/definitions/canvas';
import { PartialAttr, AttrEval, AttrEvalPartial } from '../attributes/types';
import { RenderAttr } from '../render/process';
import { Canvas } from '../types/events';
import * as events from '../types/events';
import * as processAttr from './attributes';
import * as processAnim from './animation';
import * as preprocessFns from '../attributes/preprocess';
import * as attrCanvas from '../attributes/definitions/canvas';
import * as attrExpr from '../attributes/expressions';
import * as attrUtils from '../attributes/utils';

export interface IAttrProcessed {
    readonly attributes: AttrEval<ICanvasAttr>;
    readonly changes: AttrEvalPartial<ICanvasAttr>;
    readonly expressions: PartialAttr<ICanvasAttr>;
    readonly animation: AnimationFull<ICanvasAttr>;
}

export const processUpdate = (
    canvas: Canvas,
    prevAttr: AttrEval<ICanvasAttr> | undefined,
    prevExpr: PartialAttr<ICanvasAttr> | undefined,
    attrData: events.IDispatchUpdate['data']
): IAttrProcessed | Error => {
    const preAttr = preprocessFns.preprocess(attrData.attributes, canvasDef);
    if (preAttr instanceof Error) return preAttr;

    const changesForced = preAttr;

    const changesInit = processAttr.initialize(canvas, prevAttr, changesForced);
    const changesEval = processAttr.evaluate(prevAttr, prevExpr, changesInit);
    const changes = attrUtils.merge(
        changesEval,
        attrCanvas.removeInvalidEdges(prevAttr, changesEval),
        canvasDef
    ) as AttrEvalPartial<ICanvasAttr>;

    const attrMerged =
        prevAttr === undefined ? changes : attrUtils.merge(prevAttr, changes, canvasDef);
    const attrRemoved = attrUtils.getNullEntries(changes, canvasDef) as AttrEvalPartial<
        ICanvasAttr
    >;
    const attributes = attrUtils.subtractFull(attrMerged, attrRemoved, canvasDef) as AttrEval<
        ICanvasAttr
    >;

    const exprChanged = attrExpr.getPermanentExpr(changesInit, canvasDef);
    const prevExprCleared = attrUtils.subtractPartial(prevExpr || {}, changesInit, canvasDef);
    const expressions = attrUtils.merge(prevExprCleared, exprChanged, canvasDef);

    const animation = processAnim.process(attrData.animation, prevAttr, changes, changesForced);
    const validateAnim = preprocessFns.preprocess(animation, processAnim.definition);
    if (validateAnim instanceof Error) return validateAnim;

    return {
        attributes: attributes,
        changes: changes,
        expressions: expressions,
        animation: animation,
    };
};

export const processHighlight = (
    prevState: AttrEval<ICanvasAttr> | undefined,
    prevExpr: PartialAttr<ICanvasAttr> | undefined,
    attrData: events.IDispatchHighlight['data']
): Pick<IAttrProcessed, 'animation' | 'changes'> | Error => {
    const preAttr = preprocessFns.preprocess(attrData.attributes, canvasDef);
    if (preAttr instanceof Error) return preAttr;
    const changes = processAttr.evaluate(prevState, prevExpr, preAttr);

    const animation = processAnim.process(attrData.animation || {}, prevState, changes, changes);
    const validateAnim = preprocessFns.preprocess(animation, processAnim.definition);
    if (validateAnim instanceof Error) return validateAnim;

    return {
        animation: animation,
        changes: changes,
    };
};

export const processReset = (
    prevAttr: AttrEval<ICanvasAttr> | undefined,
    attrData: events.IDispatchUpdate['data']
): IAttrProcessed | Error => {
    const changes = { visible: false };

    const animation = processAnim.process(attrData.animation, prevAttr, changes, changes);
    const validateAnim = preprocessFns.preprocess(animation, processAnim.definition);
    if (validateAnim instanceof Error) return validateAnim;

    return {
        attributes: { ...prevAttr, ...changes },
        changes: changes,
        expressions: {},
        animation: animation,
    };
};

export const getRenderData = (processed: IAttrProcessed): RenderAttr<ICanvasAttr> => {
    return {
        name: 'canvas',
        attr: processed.attributes,
        animation: processed.animation,
        changes: processed.changes,
    };
};
