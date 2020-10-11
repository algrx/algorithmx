import { CanvasSpec, canvasSpec } from './attributes/components/canvas';
import { AnimSpec, animSpec } from './attributes/components/animation';
import { InputAttr, FullAttr, PartialAttr } from './attributes/derived';
import { preprocess } from './attributes/preprocess';
import { AttrType } from './attributes/spec';
import { CanvasElement, ClientState, ReceiveEvent, DispatchEvent } from './types';

export interface EventContext {
    readonly state: ClientState;
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
    const preChanges = preprocess(
        canvasSpec,
        { path: [['canvas', AttrType.Record]], validVars: [] },
        inputChanges
    );
    if (preChanges instanceof Error) {
        context.callback({ error: { type: 'attribute', message: preChanges.message } });
        return state;
    }

    // preprocess the attribute endpoint defaults
    const defaultAttr = preprocess(
        animSpec,
        { path: [['defaultattr', AttrType.Record]], validVars: [] },
        inputDefaults ?? {}
    );
    if (defaultAttr instanceof Error) {
        context.callback({ error: { type: 'attribute', message: defaultAttr.message } });
        return state;
    }

    const allChanges = preChanges;
    console.log(preChanges);
    const fullAttrs = state.attributes;

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

    if (allChanges?.visible?.value === false) {
        // reset the canvas completely
        return {
            ...state,
            attributes: undefined,
            //layout: layout.reset(state.layout),
            //renderBehavior: undefined,
        };
    }

    return {
        ...state,
        attributes: fullAttrs,
        //layout: layoutState,
        //renderBehavior: newBehavior,
    };
};

export const executeEvent = (context: EventContext, event: DispatchEvent): ClientState => {
    if (event.message !== undefined) {
        context.callback({ message: event.message });
    }

    const attrState =
        event.attrs !== undefined
            ? updateAttrs(context, event.attrs, event.defaultattr)
            : context.state;

    return attrState;
};
