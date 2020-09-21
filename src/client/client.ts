import { CanvasSpec } from './attributes/components/canvas';
import { PartialAttr, FullAttr } from './attributes/derived-attr';
import { RenderBehavior } from './render/canvas/behavior';
import {
    SchedulerState,
    SchedulerTask,
    initSchedulerState,
    scheduleEvent,
    executeEvent,
} from './scheduler';
import { Canvas, ReceiveEvent, DispatchEvent, EnumDispatchType } from './types/events';
import * as renderCanvasLive from './render/canvas/live';
import * as layout from './layout/layout';
import * as clientEvents from './events';

export interface ClientState {
    readonly scheduler: SchedulerState;
    readonly attributes?: FullAttr<CanvasSpec>;
    readonly renderBehavior?: RenderBehavior;
}

export type ClientListener = (event: ReceiveEvent) => void;

export interface Client {
    canvas: Canvas;
    state: ClientState;
    layout: layout.ILayoutState;

    onReceive(listener: ClientListener): void;
    dispatch(event: DispatchEvent): void;
    listener: ClientListener;
    setState(state: ClientState): void;
    tick(): void;
    receiveEvent(event: DispatchEvent, queue: DispatchEvent['queue']): void;
    executeEvent(event: DispatchEvent): void;
}

const initState: ClientState = {
    scheduler: initSchedulerState,
    attributes: undefined,
    renderBehavior: undefined,
};

export class Client {
    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.state = initState;
        (this.layout = layout.init(this.tick)), (this.listener = () => null);
    }

    setState(state: ClientState) {
        this.state = state;
    }

    onReceive(fn: ClientListener) {
        this.listener = fn;
    }

    dispatch(event: DispatchEvent) {
        const task = scheduleEvent(this.state.scheduler, event.queue, event, this.receiveEvent);
        this.setState({ ...this.state, scheduler: task.state });
        task.execute();
    }

    receiveEvent(event: DispatchEvent, queue: DispatchEvent['queue']) {
        const schedulerState = this.state.scheduler;
        const task = executeEvent(schedulerState, queue, event, this.executeEvent);
        this.setState({ ...this.state, scheduler: task.state });
        task.execute();
    }

    executeEvent(event: DispatchEvent) {
        const executeContext: clientEvents.ExecuteContext = {
            state: this.state,
            listener: this.listener,
            tick: this.tick,
        };
        const state = clientEvents.executeEvent(executeContext, event);
        this.setState(state);
        this.tick();
    }

    tick() {
        if (this.state.attributes !== undefined)
            renderCanvasLive.updateCanvas(this.canvas, this.state.attributes, this.layout);
    }
}
