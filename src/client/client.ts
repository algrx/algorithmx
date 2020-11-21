import { CanvasSpec } from './attributes/components/canvas';
import { initSchedulerState, scheduleEvent, SchedulerEvent } from './scheduler';
import { DispatchEvent, ReceiveEvent, CanvasElement, ClientState } from './types';
import { executeEvent, EventContext } from './events';
import { LayoutState, initLayout } from './layout/canvas';
import { renderLive, initRenderState } from './render/canvas';

export interface Client {
    canvas: CanvasElement;
    state: ClientState;
    layout: LayoutState;

    onreceive(fn: (event: ReceiveEvent) => void): void;
    dispatch(event: DispatchEvent): void;

    eventCallback: (event: ReceiveEvent) => void;
    setState(state: ClientState): void;
    tick(): void;
    onSchedulerEvent(event: SchedulerEvent, queue: string | null): void;
}

const initState = (tick: () => void): ClientState => {
    return {
        scheduler: initSchedulerState,
        attributes: undefined,
        expressions: {},
        layout: initLayout(tick),
        render: initRenderState,
    };
};

export class Client {
    constructor(canvas: CanvasElement) {
        this.canvas = canvas;
        this.state = initState(this.tick.bind(this));
        this.eventCallback = () => null;
    }

    setState(state: ClientState) {
        this.state = state;
    }

    onreceive(fn: (event: ReceiveEvent) => void) {
        this.eventCallback = fn;
    }

    execute(event: DispatchEvent) {
        const state = executeEvent(
            {
                state: this.state,
                canvasEl: this.canvas,
                receive: this.eventCallback,
                tick: this.tick.bind(this),
            },
            event
        );

        this.setState(state);
        this.tick();
    }

    dispatch(event: DispatchEvent) {
        const schedulerState = scheduleEvent(
            this.state.scheduler,
            {
                dispatch: this.dispatch.bind(this),
                execute: this.execute.bind(this),
            },
            event
        );
        this.setState({ ...this.state, scheduler: schedulerState });
    }

    tick() {
        if (this.state.attributes?.visible.value === true)
            renderLive(this.canvas, this.state.attributes, this.state.layout);
    }
}
