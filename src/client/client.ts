import { CanvasSpec } from './attributes/components/canvas';
import { PartialAttr, FullAttr } from './attributes/derived-attr';
import { RenderBehavior } from './render/canvas/behavior';
import {
    SchedulerState,
    SchedulerTask,
    initSchedulerState,
    scheduleEvent,
    processSchedulerEvent,
    SchedulerEvent,
} from './scheduler';
import { CanvasElement, ReceiveEvent, DispatchEvent } from './types/events';
import * as renderCanvasLive from './render/canvas/live';
import * as layout from './layout/layout';
import { EventContext, executeEvent } from './events';

export interface ClientState {
    readonly scheduler: SchedulerState;
    readonly attributes?: FullAttr<CanvasSpec>;
    readonly renderBehavior?: RenderBehavior;
}

export type OnEventFn = (event: ReceiveEvent) => void;

export interface Client {
    canvas: CanvasElement;
    state: ClientState;
    layout: layout.ILayoutState;

    onEvent(listener: OnEventFn): void;
    event(event: DispatchEvent): void;

    listener: OnEventFn;
    setState(state: ClientState): void;
    tick(): void;
    onSchedulerEvent(event: DispatchEvent, queue: string | null): void;
}

const initState: ClientState = {
    scheduler: initSchedulerState,
    attributes: undefined,
    renderBehavior: undefined,
};

export class Client {
    constructor(canvas: CanvasElement) {
        this.canvas = canvas;
        this.state = initState;
        this.layout = layout.init(this.tick);
        this.listener = () => null;
    }

    setState(state: ClientState) {
        this.state = state;
    }

    onEvent(fn: OnEventFn) {
        this.listener = fn;
    }

    event(event: DispatchEvent) {
        // the default queue is named 'default'
        const task = scheduleEvent(
            this.state.scheduler,
            event.withQ ?? 'default',
            event,
            this.onSchedulerEvent
        );
        this.setState({ ...this.state, scheduler: task.state });
        task.execute();
    }

    onSchedulerEvent(event: SchedulerEvent, queue: string | null) {
        // execute the event
        const executeContext: EventContext = {
            state: this.state,
            listener: this.listener,
            tick: this.tick,
        };
        const state = executeEvent(executeContext, event as DispatchEvent);
        this.setState(state);
        this.tick();

        // update the scheduler and execute the next event
        const task = processSchedulerEvent(
            this.state.scheduler,
            queue,
            event,
            this.onSchedulerEvent
        );
        this.setState({ ...this.state, scheduler: task.state });
        task.execute();
    }

    tick() {
        if (this.state.attributes !== undefined)
            renderCanvasLive.updateCanvas(this.canvas, this.state.attributes, this.layout);
    }
}
