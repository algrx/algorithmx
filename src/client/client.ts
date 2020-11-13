import { CanvasSpec } from './attributes/components/canvas';
import {
    initSchedulerState,
    scheduleEvent,
    processSchedulerEvent,
    SchedulerEvent,
} from './scheduler';
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

const processEvent = (client: Client, event: SchedulerEvent, queue: string | null) => {
    // execute the event
    const state = executeEvent(
        {
            state: client.state,
            canvasElement: client.canvas,
            receive: client.eventCallback,
            tick: client.tick.bind(client),
        },
        event as DispatchEvent
    );

    client.setState(state);
    client.tick();

    // update the scheduler and execute the next event
    const task = processSchedulerEvent(client.state.scheduler, queue, event, (e, q) =>
        processEvent(client, e, q)
    );
    client.setState({ ...client.state, scheduler: task.state });
    task.execute();
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

    dispatch(event: DispatchEvent) {
        // the default queue is named 'default'
        const withQ = event.withQ === null ? null : String(event.withQ ?? 0);
        const task = scheduleEvent(this.state.scheduler, withQ, event, (e, q) =>
            processEvent(this, e, q)
        );
        this.setState({ ...this.state, scheduler: task.state });
        task.execute();
    }

    tick() {
        if (this.state.attributes)
            renderLive(this.canvas, this.state.attributes, this.state.layout);
    }
}
