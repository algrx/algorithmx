import * as events from './types/events';
import { EnumDispatchType } from './types/events';

type Event = events.DispatchEvent;
type SchedulerCallback = (event: Event, queue: string | null) => void;

interface QueueState {
    readonly events: ReadonlyArray<Event>;
    readonly busy: boolean;
    readonly stopped: boolean;
    readonly current?: Event;
}
export interface SchedulerState {
    readonly queues: { readonly [queue: string]: QueueState };
    readonly stopped: boolean;
}
export interface SchedulerTask {
    readonly state: SchedulerState;
    readonly execute: () => void;
}

const initQueue = (state: SchedulerState): QueueState => {
    return {
        events: [],
        busy: false,
        stopped: state.stopped,
    };
};
export const initSchedulerState: SchedulerState = {
    queues: {},
    stopped: false,
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

const modifyMultipleQueues = (
    state: SchedulerState,
    queues: ReadonlyArray<string>,
    stateFn: (state: SchedulerState, q: string) => SchedulerState,
    taskFn: (state: SchedulerState, q: string) => SchedulerTask
) => {
    return queues.reduce(
        (resultTask, q) => {
            const newState = stateFn(resultTask.state, q);
            const task = taskFn(newState, q);
            return {
                state: task.state,
                execute: () => {
                    task.execute();
                    resultTask.execute();
                },
            };
        },
        {
            state: state,
            execute: () => {
                /**/
            },
        }
    );
};

export const start = (
    state: SchedulerState,
    queues: ReadonlyArray<string> | null,
    callback: SchedulerCallback
): SchedulerTask => {
    const newState: SchedulerState = queues === null ? { ...state, stopped: false } : state;
    const allQueues = queues === null ? Object.keys(state.queues) : queues;
    return modifyMultipleQueues(
        newState,
        allQueues,
        (s, q) => updateQueueState(s, q, { stopped: false }),
        (s, q) => executeNext(s, q, callback)
    );
};

export const stop = (
    state: SchedulerState,
    queues: ReadonlyArray<string> | null
): SchedulerTask => {
    const newState: SchedulerState = queues === null ? { ...state, stopped: true } : state;
    const allQueues = queues === null ? Object.keys(state.queues) : queues;

    const finalState = allQueues.reduce(
        (resultState, queue) => updateQueueState(resultState, queue, { stopped: true }),
        newState
    );
    return {
        state: finalState,
        execute: () => {
            /**/
        },
    };
};

export const cancel = (
    state: SchedulerState,
    queues: ReadonlyArray<string> | null
): SchedulerTask => {
    const newState: SchedulerState = queues === null ? { ...state, queues: {} } : state;
    const allQueues = queues === null ? Object.keys(state.queues) : queues;

    const finalState = allQueues.reduce(
        (resultState, queue) => updateQueueState(resultState, queue, { events: [], busy: false }),
        newState
    );
    return {
        state: finalState,
        execute: () => {
            /**/
        },
    };
};

export const scheduleEvent = (
    state: SchedulerState,
    queue: string | null,
    event: Event,
    callback: SchedulerCallback
): SchedulerTask => {
    if (queue === null) {
        // execute the event immediately if no queue is specified
        return {
            state: state,
            execute: () => callback(event, queue),
        };
    } else {
        const queueState = getQueueState(state, queue);
        const newState = updateQueueState(state, queue, {
            events: queueState.events.concat([event]),
        });

        // only trigger event execution if the queue was previously empty
        if (queueState.events.length === 0) return executeNext(newState, queue, callback);
        else
            return {
                state: newState,
                execute: () => {
                    /**/
                },
            };
    }
};

const executeNext = (
    state: SchedulerState,
    queue: string | null,
    callback: SchedulerCallback,
    force = false
): SchedulerTask => {
    if (queue === null) {
        // the null queue has no next event
        return { state: state, execute: () => null };
    }

    const queueState = getQueueState(state, queue);

    if (!force && queueState.busy) {
        // if the queue is busy, only execute the next event when forced
        return { state: state, execute: () => null };
    } else if (queueState.stopped || queueState.events.length === 0) {
        // either the queue is stopped or all events have finished, and so it is no longer busy
        return {
            state: updateQueueState(state, queue, { busy: false }),
            execute: () => null,
        };
    } else if (queue === null || (!force && queueState.busy)) {
        // if the queue is busy, only execute the next event when forced
        return {
            state: state,
            execute: () => null,
        };
    } else {
        // get the next event in the queue, delay it if it's a pause event, otherwise execute it immediately
        const event = queueState.events[0];
        const executeFunc = () => {
            if (event.type === events.EnumDispatchType.pause) {
                const delay = (event as events.IDispatchPause).data.duration * 1000;
                setTimeout(() => callback(event, queue), delay);
            } else callback(event, queue);
        };
        // pop the next event, set it as the current event, and make the queue busy
        return {
            state: updateQueueState(state, queue, {
                events: queueState.events.slice(1),
                busy: true,
                current: event,
            }),
            execute: executeFunc,
        };
    }
};

const isQueueUpdateEvent = (event: Event): event is events.IDispatchQueueUpdate =>
    event.type === EnumDispatchType.start ||
    event.type === EnumDispatchType.stop ||
    event.type === EnumDispatchType.cancel;

const updateQueue = (
    state: SchedulerState,
    event: events.IDispatchQueueUpdate,
    callback: SchedulerCallback
): SchedulerTask => {
    if (event.type === EnumDispatchType.start) return start(state, event.data.queues, callback);
    else if (event.type === EnumDispatchType.stop) return stop(state, event.data.queues);
    else return cancel(state, event.data.queues);
};

export const executeEvent = (
    state: SchedulerState,
    queue: string | null,
    event: Event,
    callback: (event: Event) => void
): SchedulerTask => {
    // check if the event is valid
    if (queue === null || getQueueState(state, queue).current === event) {
        if (isQueueUpdateEvent(event)) {
            // process start, stop and cancel
            const queueTask = updateQueue(state, event, callback);
            // force-trigger the next event
            const nextTask = executeNext(queueTask.state, queue, callback, true);

            return {
                state: nextTask.state,
                execute: () => {
                    queueTask.execute();
                    nextTask.execute();
                },
            };
        } else {
            // force-trigger the next event
            const nextTask = executeNext(state, queue, callback, true);
            return {
                state: nextTask.state,
                execute: () => {
                    callback(event);
                    nextTask.execute();
                },
            };
        }
    } else {
        return { state: state, execute: () => null };
    }
};
