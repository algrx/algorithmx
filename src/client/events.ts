import {
    CanvasSpec,
    canvasSpec,
    createCanvasDefaults,
    evalCanvas,
} from './attributes/components/canvas';
import { AnimSpec, animSpec } from './attributes/components/animation';
import { InputAttr, FullAttr, PartialAttr } from './attributes/derived';
import { preprocess } from './attributes/preprocess';
import { AttrType } from './attributes/spec';
import { CanvasElement, ClientState, ReceiveEvent, DispatchEvent } from './types';
import {
    removeInvalidEdges,
    adjustEdgeIds,
    applyDefaults,
    mergeChanges,
    fillStarKeys,
    addVisible,
} from './attributes/transform';
import { updateCanvasLayout, resetLayout } from './layout/canvas';
import { renderAttrs, renderWithState, renderWithTick, renderWithLayout } from './render/render';

export interface EventContext {
    readonly state: ClientState;
    readonly canvasElement: CanvasElement;
    readonly callback: (event: ReceiveEvent) => void;
    readonly tick: () => void;
}

//import { RenderBehavior } from './render/canvas/behavior';

/*
const render = (
    canvas: CanvasElement,
    prevAttrs: FullAttr<CanvasSpec>,
    changes: PartialAttr<CanvasSpec>,
    tick: () => void,
    layoutState: layout.ILayoutState
): void => {
    renderCanvas.renderCanvas(canvas, renderData);
    if (renderData.attr.visible === false) return;

    renderCanvasMisc.renderWithLayout(canvas, renderData, layoutState);

    renderCanvasMisc.renderWithTick(canvas, renderData, tick);
    renderCanvasLive.updateCanvas(canvas, renderData.attr, layoutState);
};

const renderBehavior = (
    canvas: CanvasElement,
    renderData: RenderAttr<CanvasSpec>,
    behavior: RenderBehavior
): RenderBehavior => {
    if (renderData.attr.visible === false) return behavior;

    const newBehavior = renderCanvasBehavior.update(canvas, renderData, behavior);
    renderCanvasBehavior.render(canvas, renderData, newBehavior);

    return newBehavior;
};
*/

const updateAttrs = (
    context: EventContext,
    inputChanges: InputAttr<CanvasSpec>,
    inputDefaults?: InputAttr<AnimSpec>
): ClientState => {
    const state = context.state;

    // preprocess the attribute changes changes
    const preprocChanges = preprocess(
        canvasSpec,
        { path: [['canvas', AttrType.Record]], validVars: [] },
        inputChanges
    );
    if (preprocChanges instanceof Error) {
        context.callback({ error: { type: 'attribute', message: preprocChanges.message } });
        return state;
    }

    // preprocess the attribute animation defaults
    const animation = preprocess(
        animSpec,
        { path: [['animation', AttrType.Record]], validVars: [] },
        inputDefaults ?? {}
    );
    if (animation instanceof Error) {
        context.callback({ error: { type: 'attribute', message: animation.message } });
        return state;
    }
    //console.log(inputAttrs)

    // apply some transformations
    type TransformFn = (
        p: FullAttr<CanvasSpec> | undefined,
        c: PartialAttr<CanvasSpec>
    ) => PartialAttr<CanvasSpec>;
    const transformFns: ReadonlyArray<TransformFn> = [
        (p, c) => fillStarKeys(canvasSpec, p, c),
        removeInvalidEdges,
        adjustEdgeIds,
        (p, c) => addVisible(canvasSpec, p, c),
    ];
    //console.log(preprocChanges);
    const prevAttrs = state.attrs;
    const transformedChanges = transformFns.reduce((acc, fn) => fn(prevAttrs, acc), preprocChanges);

    // apply defaults
    const changesWithDefaults = applyDefaults(canvasSpec, prevAttrs, transformedChanges, [
        createCanvasDefaults(prevAttrs, transformedChanges),
        animation,
    ]);

    // evaluate expressions
    const changesWithoutSelfRef = evalCanvas(prevAttrs, changesWithDefaults, true);
    const fullChanges = evalCanvas(prevAttrs, changesWithoutSelfRef, false);

    // merge all changes with previous attributes
    const fullAttrs = mergeChanges(canvasSpec, prevAttrs, changesWithoutSelfRef);

    // render the canvas
    renderAttrs(context.canvasElement, fullAttrs, fullChanges);
    renderWithLayout(context.canvasElement, fullAttrs, fullChanges, state.layout);
    const newRenderState = renderWithState(
        context.canvasElement,
        fullAttrs,
        fullChanges,
        state.render
    );

    /*
    renderCanvasMisc.renderWithLayout(canvas, renderData, layoutState);
    renderCanvasMisc.renderWithTick(canvas, renderData, tick);
    renderCanvasLive.updateCanvas(canvas, renderData.attr, layoutState);
    */

    //console.log(fullChanges);
    /*
    const renderData = renderElement.preprocess(pipeline.getRenderData(processed));
    const layoutState = layout.update(state.layout, processed.attributes, processed.changes);

    render(state.canvas, renderData, context.tick, layoutState);
    const newBehavior = renderBehavior(state.canvas, renderData, state.renderBehavior);

    if (processed.attributes.visible) {
        const clickFn = (n: string) => context.listener(dispatchClick(n));
        const hoverFn = (n: string, h: boolean) => context.listener(dispatchHover(n, h));
        renderCanvasListeners.registerNodeClick(state.canvas, renderData, clickFn);
        renderCanvasListeners.registerNodeHover(state.canvas, renderData, hoverFn);
    }
    */

    if (fullAttrs === undefined) {
        // reset the canvas completely
        return {
            ...state,
            attrs: undefined,
            layout: resetLayout(state.layout),
            render: {},
        };
    }

    return {
        ...state,
        attrs: fullAttrs,
        layout: updateCanvasLayout(state.layout, fullAttrs, fullChanges),
        render: newRenderState,
    };
};

export const executeEvent = (context: EventContext, event: DispatchEvent): ClientState => {
    if (event.message !== undefined) {
        context.callback({ message: event.message });
    }

    const attrState =
        event.attrs !== undefined
            ? updateAttrs(context, event.attrs, event.animation)
            : context.state;

    return attrState;
};
