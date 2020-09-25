import { CanvasSpec } from './attributes/components/canvas';
import {
    initSchedulerState,
    scheduleEvent,
    processSchedulerEvent,
    SchedulerEvent,
} from './scheduler';
import { DispatchEvent, ReceiveEvent, CanvasElement, ClientState } from './types';
import { executeEvent, EventContext } from './events';

export interface Client {
    canvas: CanvasElement;
    state: ClientState;
    //layout: layout.ILayoutState;

    onevent(fn: (event: ReceiveEvent) => void): void;
    event(event: DispatchEvent): void;

    eventCallback: (event: ReceiveEvent) => void;
    setState(state: ClientState): void;
    tick(): void;
    onSchedulerEvent(event: DispatchEvent, queue: string | null): void;
}

const initState: ClientState = {
    scheduler: initSchedulerState,
    attributes: undefined,
    //renderBehavior: undefined,
};

export class Client {
    constructor(canvas: CanvasElement) {
        this.canvas = canvas;
        this.state = initState;
        //this.layout = layout.init(this.tick);
        this.eventCallback = () => null;
    }

    setState(state: ClientState) {
        this.state = state;
    }

    onevent(fn: (event: ReceiveEvent) => void) {
        this.eventCallback = fn;
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
        const state = executeEvent(
            {
                state: this.state,
                callback: this.eventCallback,
                tick: this.tick,
            },
            event as DispatchEvent
        );

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
        //if (this.state.attributes !== undefined)
        //renderCanvasLive.updateCanvas(this.canvas, this.state.attributes, this.layout);
    }
}
