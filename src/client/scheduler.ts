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

interface SchedulerCbs {
    readonly dispatch: (event: SchedulerEvent) => void;
    readonly execute: (event: SchedulerEvent) => void;
}

interface QueueState {
    readonly events: ReadonlyArray<SchedulerEvent>;
    readonly busy: boolean;
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
        busy: false,
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

const updateQueue = (
    state: SchedulerState,
    [queue, withQ]: [string, string | null],
    event: QueueEvent,
    callbacks: SchedulerCbs
): SchedulerState => {
    if (event.pause !== undefined || event.clear === true || event.stopped === true) {
        // clear the previous pause
        const prevTimeout = state.queues[queue]?.timeoutId;
        if (prevTimeout !== undefined) clearTimeout(prevTimeout);
    }

    const unpause = event.pause !== undefined && event.pause <= 0;
    const stateWithPause = unpause
        ? updateQueueState(state, queue, { paused: false })
        : event.pause !== undefined
        ? updateQueueState(state, queue, {
              paused: true,
              timeoutId: setTimeout(() => {
                  callbacks.dispatch({
                      queues: { [queue]: { pause: 0 } },
                      withQ: null,
                  });
              }, (event.pause as number) * 1000),
          })
        : state;

    const stateWithStop =
        event.stopped === true
            ? updateQueueState(stateWithPause, queue, { stopped: true, paused: false })
            : event.stopped === false
            ? updateQueueState(stateWithPause, queue, { stopped: false })
            : stateWithPause;

    const newState =
        event.clear === true
            ? updateQueueState(stateWithStop, queue, { events: [], busy: false, paused: false })
            : stateWithStop;

    if ((unpause || event.stopped === false) && withQ !== queue) {
        // execute another queue after if becomes unpaused/started
        return executeQueue(newState, callbacks, queue);
    }
    return newState;
};

const executeEvent = (
    state: SchedulerState,
    callbacks: SchedulerCbs,
    withQ: string | null,
    event: SchedulerEvent
): SchedulerState => {
    const stateWithoutEvent =
        withQ === null
            ? state
            : updateQueueState(state, withQ, {
                  events: getQueueState(state, withQ).events.slice(1),
              });

    // update queues with start/stop/clear/pause actions
    const queueEvents = Object.entries(event.queues ?? {}).reduce(
        (acc, [k, q]) => ({
            ...acc,
            ...(k === '*' ? mapDict(stateWithoutEvent.queues, (_) => q) : { [k]: q }),
        }),
        {} as Dict<string, QueueEvent>
    );
    const newState = Object.keys(queueEvents).reduce(
        (acc, k) => updateQueue(acc, [k, withQ], queueEvents[k], callbacks),
        stateWithoutEvent
    );

    callbacks.execute(event);
    return newState;
};

const executeQueue = (
    state: SchedulerState,
    callbacks: SchedulerCbs,
    queue: string
): SchedulerState => {
    const initQueueState = getQueueState(state, queue);
    if (initQueueState.stopped || initQueueState.paused) return state;

    return getQueueState(state, queue).events.reduce((stateAcc, event) => {
        const queueState = getQueueState(stateAcc, queue);
        if (queueState.stopped || queueState.paused) return stateAcc;

        return executeEvent(stateAcc, callbacks, queue, event);
    }, state);
};

export const scheduleEvent = (
    state: SchedulerState,
    callbacks: SchedulerCbs,
    event: SchedulerEvent
): SchedulerState => {
    const withQ = event.withQ === null ? null : String(event.withQ ?? 0);
    if (withQ === null) {
        // execute the event immediately if no queue is specified
        return executeEvent(state, callbacks, withQ, event);
    } else {
        const stateWithEvent = updateQueueState(state, withQ, {
            events: getQueueState(state, withQ).events.concat([event]),
        });
        return executeQueue(stateWithEvent, callbacks, withQ);
    }
};
