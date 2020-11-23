import { dictFromArray, mapDict, Dict } from './utils';

interface QueueEvent {
    readonly stopped?: boolean;
    readonly pause?: number;
    readonly clear?: boolean;
}
interface BaseEvent {
    readonly queues?: { readonly [k: string]: QueueEvent };
    readonly withQ?: string | number | null;
}

export type SchedulerEvent = BaseEvent;

interface QueueState {
    readonly events: ReadonlyArray<SchedulerEvent>;
    readonly stopped: boolean;
    readonly paused: boolean;
    readonly timeoutId?: number;
}
export interface SchedulerState {
    readonly queues: { readonly [queue: string]: QueueState };
}

const initQueue = (state: SchedulerState): QueueState => {
    return {
        events: [],
        stopped: false,
        paused: false,
    };
};
export const initSchedulerState: SchedulerState = {
    queues: {},
};

const getQueueState = (state: SchedulerState, queue: string): QueueState => {
    return state.queues[queue] ?? initQueue(state);
};
const updateQueueState = (
    state: SchedulerState,
    queue: string,
    changes: Partial<QueueState>
): SchedulerState => {
    return {
        ...state,
        queues: { ...state.queues, [queue]: { ...getQueueState(state, queue), ...changes } },
    };
};

const executeQueueEvent = (
    state: SchedulerState,
    unpauseQueue: () => void,
    queue: string,
    event: QueueEvent
): SchedulerState => {
    if (event.pause !== undefined || event.clear === true || event.stopped === true) {
        // clear the previous pause
        const prevTimeout = state.queues[queue]?.timeoutId;
        if (prevTimeout !== undefined) clearTimeout(prevTimeout);
    }

    const stateWithPause =
        event.pause !== undefined && event.pause <= 0
            ? updateQueueState(state, queue, { paused: false })
            : event.pause !== undefined
            ? updateQueueState(state, queue, {
                  paused: true,
                  timeoutId: setTimeout(unpauseQueue, (event.pause as number) * 1000),
              })
            : state;

    const stateWithStop =
        event.stopped === true
            ? updateQueueState(stateWithPause, queue, { stopped: true, paused: false })
            : event.stopped === false
            ? updateQueueState(stateWithPause, queue, { stopped: false, paused: false })
            : stateWithPause;

    const newState =
        event.clear === true
            ? updateQueueState(stateWithStop, queue, { events: [], paused: false })
            : stateWithStop;

    return newState;
};

const getNextEvent = (state: SchedulerState): [SchedulerState, SchedulerEvent | undefined] => {
    return Object.entries(state.queues).reduce(
        ([accState, accElement], [k, queueState]) => {
            if (
                accElement !== undefined ||
                queueState.stopped ||
                queueState.paused ||
                queueState.events.length === 0
            )
                return [accState, accElement];
            else {
                const event = queueState.events[0];
                const newState = updateQueueState(state, k, { events: queueState.events.slice(1) });
                return [newState, event];
            }
        },
        [state, undefined] as [SchedulerState, SchedulerEvent | undefined]
    );
};

interface SchedulerCbs {
    readonly setState: (s: SchedulerState) => void;
    readonly getState: () => SchedulerState;
    readonly execute: (event: SchedulerEvent) => void;
}

const getQueueFromEvent = (event: SchedulerEvent): string | null =>
    event.withQ === null ? null : String(event.withQ ?? 0);

const executeEvent = (callbacks: SchedulerCbs, event: SchedulerEvent) => {
    const state = callbacks.getState();

    const unpauseQueueFn = (q: string) => () =>
        scheduleEvent(callbacks, {
            queues: { [q]: { pause: 0 } },
            withQ: null,
        });

    // update queues with start/stop/clear/pause actions
    const queueEvents = Object.entries(event.queues ?? {}).reduce(
        (acc, [k, q]) => ({
            ...acc,
            ...(k === '*' ? mapDict(state.queues, (_) => q) : { [k]: q }),
        }),
        {} as Dict<string, QueueEvent>
    );
    const newState = Object.keys(queueEvents).reduce(
        (acc, k) => executeQueueEvent(acc, unpauseQueueFn(k), k, queueEvents[k]),
        state
    );

    callbacks.setState(newState);
    callbacks.execute(event);
};

export const scheduleEvent = (callbacks: SchedulerCbs, event: SchedulerEvent) => {
    const withQ = getQueueFromEvent(event);
    if (withQ === null) {
        // execute the event immediately if no queue is specified
        executeEvent(callbacks, event);
    } else {
        // add the event to the queue
        const state = callbacks.getState();
        const stateWithEvent = updateQueueState(state, withQ, {
            events: getQueueState(state, withQ).events.concat([event]),
        });
        callbacks.setState(stateWithEvent);
    }

    // execute all remaining events
    while (true) {
        const [state, nextEvent] = getNextEvent(callbacks.getState());
        if (nextEvent === undefined) break;
        callbacks.setState(state);
        executeEvent(callbacks, nextEvent);
    }
};
