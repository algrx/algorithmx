import { CanvasSpec } from './attributes/components/canvas';
import { initSchedulerState, scheduleEvent, SchedulerEvent, SchedulerState } from './scheduler';
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

    receive: (event: ReceiveEvent) => void;
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
let scheduler: SchedulerState = initSchedulerState;

export class Client {
    constructor(canvas: CanvasElement) {
        this.canvas = canvas;
        this.state = initState(this.tick.bind(this));
        this.receive = () => null;
    }

    setState(state: ClientState) {
        this.state = state;
    }

    onreceive(fn: (event: ReceiveEvent) => void) {
        this.receive = fn;
    }

    execute(event: DispatchEvent) {
        const newState = executeEvent(
            {
                state: this.state,
                canvasEl: this.canvas,
                receive: this.receive,
                tick: this.tick.bind(this),
            },
            event
        );

        // note that the scheduler state may have changed after executing the event
        this.setState({ ...newState, scheduler: this.state.scheduler });
        this.tick();
    }

    dispatch(event: DispatchEvent) {
        scheduleEvent(
            {
                setState: (s) => this.setState({ ...this.state, scheduler: s }),
                getState: () => this.state.scheduler,
                execute: this.execute.bind(this),
            },
            event
        );
    }

    tick() {
        if (this.state.attributes?.visible.value === true)
            renderLive(this.canvas, this.state.attributes, this.state.layout);
    }
}
