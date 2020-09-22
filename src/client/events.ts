import { CanvasSpec } from './attributes/definitions/canvas';
import { RenderAttr } from './render/process';
import { ClientState, OnEventFn } from './client';
import { RenderBehavior } from './render/canvas/behavior';
//import * as pipeline from './pipeline/pipeline';
import * as renderElement from './render/element';
import * as renderCanvas from './render/canvas/render';
import * as renderCanvasBehavior from './render/canvas/behavior';
import * as renderCanvasListeners from './render/canvas/listeners';
import * as renderCanvasLive from './render/canvas/live';
import * as renderCanvasMisc from './render/canvas/misc';
import * as layout from './layout/layout';
import { DispatchEvent } from './types/events';

export interface EventContext {
    readonly state: ClientState;
    readonly listener: OnEventFn;
    readonly tick: () => void;
}

/*
const render = (
    canvas: events.CanvasElement,
    renderData: RenderAttr<CanvasSpec>,
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
    canvas: events.CanvasElement,
    renderData: RenderAttr<CanvasSpec>,
    behavior: RenderBehavior
): RenderBehavior => {
    if (renderData.attr.visible === false) return behavior;

    const newBehavior = renderCanvasBehavior.update(canvas, renderData, behavior);
    renderCanvasBehavior.render(canvas, renderData, newBehavior);

    return newBehavior;
};

const executeUpdate = (context: EventContext, event: events.IDispatchUpdate): ClientState => {
    const state = context.state;
    if (event.data.attributes === null) return executeReset(context, event);

    const processed = pipeline.processUpdate(
        state.canvas,
        state.attributes,
        state.expressions,
        event.data
    );
    if (processed instanceof Error) {
        context.listener(dispatchError(processed.message, events.EnumErrorType.attribute));
        return state;
    }

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

    return {
        ...state,
        expressions: processed.expressions,
        attributes: processed.attributes,
        layout: layoutState,
        renderBehavior: newBehavior,
    };
};

const executeHighlight = (context: EventContext, event: events.IDispatchHighlight): void => {
    const state = context.state;
    const processed = pipeline.processHighlight(state.attributes, state.expressions, event.data);
    if (processed instanceof Error) {
        context.listener(dispatchError(processed.message, events.EnumErrorType.attribute));
        return;
    }

    const renderDataInit: RenderAttr<CanvasSpec> = {
        name: 'canvas',
        attr: state.attributes,
        animation: processed.animation,
        highlight: processed.changes,
    };
    const renderData = renderElement.preprocess(renderDataInit);

    render(state.canvas, renderData, context.tick, state.layout);
    renderBehavior(state.canvas, renderData, state.renderBehavior);
};
*/

export const executeEvent = (context: EventContext, event: DispatchEvent): ClientState => {
    if (event.type === events.EnumDispatchType.broadcast) {
        context.listener({
            type: events.EnumReceiveType.broadcast,
            data: { message: event.data.message },
        });
        return context.state;
    } else if (event.type === events.EnumDispatchType.update) {
        return executeUpdate(context, event);
    } else if (event.type === events.EnumDispatchType.highlight) {
        executeHighlight(context, event);
        return context.state;
    } else return context.state;
};
