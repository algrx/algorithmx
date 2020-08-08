import { Canvas } from '../types/events';
import { ICanvasAttr, definition as canvasDef } from '../attributes/definitions/canvas';
import { PartialAttr, AttrEval, AttrEvalPartial } from '../attributes/types';
import * as renderCanvasUtils from '../render/canvas/utils';
import * as attrCanvas from '../attributes/definitions/canvas';
import * as attrExpr from '../attributes/expressions';
import * as attrUtils from '../attributes/utils';

export const initialize = (
    canvas: Canvas,
    prevState: ICanvasAttr | undefined,
    changes: PartialAttr<ICanvasAttr>
): PartialAttr<ICanvasAttr> => {
    const prevStateNew = prevState || attrCanvas.init(renderCanvasUtils.getCanvasSize(canvas));
    const initChildren = attrCanvas.initChildren(prevStateNew, changes);

    const changesNew =
        prevState === undefined ? attrUtils.merge(prevStateNew, changes, canvasDef) : changes;
    return attrUtils.merge(initChildren, changesNew, canvasDef);
};

export const evaluate = (
    prevState: AttrEval<ICanvasAttr> | undefined,
    prevExpr: PartialAttr<ICanvasAttr> | undefined,
    changes: PartialAttr<ICanvasAttr>
): AttrEvalPartial<ICanvasAttr> => {
    // find non-expressions attributes
    const changedNonExpr = attrExpr.getNonExpr(changes, canvasDef);
    const fullNonExprInit = attrUtils.merge(
        prevState || {},
        changedNonExpr,
        canvasDef
    ) as AttrEvalPartial<ICanvasAttr>;

    // evaluate changed expressions
    const changedExpr = attrExpr.getExpr(changes, canvasDef);
    const changedExprEval = attrCanvas.evaluate(fullNonExprInit, changedExpr, changes);

    // evaluate permanent expressions
    const fullNonExpr = attrUtils.merge(
        fullNonExprInit,
        changedExprEval,
        canvasDef
    ) as AttrEvalPartial<ICanvasAttr>;
    const permanentExprEval = attrCanvas.evaluate(fullNonExpr, prevExpr || {}, changes);
    const permanentExprChanges = attrUtils.keepIfDifferent(
        permanentExprEval,
        prevState || {},
        canvasDef
    );

    // combine all changes
    const changesEval = attrUtils.merge(changes, changedExprEval, canvasDef);
    const allChangesEval = attrUtils.merge(
        permanentExprChanges,
        changesEval,
        canvasDef
    ) as AttrEvalPartial<ICanvasAttr>;

    return allChangesEval;
};
