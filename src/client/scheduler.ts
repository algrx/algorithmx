interface QueueEvent {
    readonly stopped?: boolean;
    readonly pause?: number | boolean;
    readonly clear?: boolean;
}
interface BaseEvent {
    readonly queues?: { readonly [k: string]: QueueEvent };
}

export type SchedulerEvent = BaseEvent;

type SchedulerCb = (event: SchedulerEvent, queue: string | null) => void;

interface QueueState {
    readonly events: ReadonlyArray<SchedulerEvent>;
    readonly busy: boolean;
    readonly stopped: boolean;
    readonly paused: boolean;
}
export interface SchedulerState {
    readonly queues: { readonly [queue: string]: QueueState };
}
export interface SchedulerTask {
    readonly state: SchedulerState;
    readonly execute: () => void;
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

const noTask = (state: SchedulerState): SchedulerTask => ({
    state: state,
    execute: () => null,
});

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

const mergeTasks = (
    state: SchedulerState,
    queues: ReadonlyArray<string>,
    taskFn: (state: SchedulerState, q: string) => SchedulerTask
): SchedulerTask => {
    return queues.reduce<SchedulerTask>(
        (accTask, q) => {
            const task = taskFn(accTask.state, q);
            return {
                state: task.state,
                execute: () => {
                    task.execute();
                    accTask.execute();
                },
            };
        },
        {
            state: state,
            execute: () => null,
        }
    );
};

const executeNext = (
    state: SchedulerState,
    queue: string | null,
    callback: SchedulerCb,
    force = false
): SchedulerTask => {
    // the null queue has no next event
    if (queue === null) return noTask(state);

    const queueState = getQueueState(state, queue);

    // if the queue is busy, do not execute the next event unless forced
    if (!force && queueState.busy) return noTask(state);

    if (queueState.stopped || queueState.paused || queueState.events.length === 0) {
        // either the queue is stopped or all events have finished, and so it is no longer busy
        return {
            state: updateQueueState(state, queue, { busy: false }),
            execute: () => null,
        };
    }

    // pop the next event and make the queue busy
    const event = queueState.events[0];
    return {
        state: updateQueueState(state, queue, {
            events: queueState.events.slice(1),
            busy: true,
        }),
        execute: () => callback(event, queue),
    };
};

const updateQueue = (
    state: SchedulerState,
    queue: string,
    event: QueueEvent,
    callback: SchedulerCb
): SchedulerTask => {
    // pause event
    const withPause: SchedulerTask =
        event.pause === false
            ? {
                  state: updateQueueState(state, queue, { paused: false }),
                  execute: () => executeNext(state, queue, callback),
              }
            : event.pause !== undefined
            ? {
                  state: updateQueueState(state, queue, { paused: true }),
                  execute: () =>
                      setTimeout(() => {
                          callback(
                              {
                                  queues: { [queue]: { pause: false } },
                              },
                              queue
                          );
                      }, (event.pause as number) * 1000),
              }
            : noTask(state);

    // stop/start event
    const withStop: SchedulerTask =
        event.stopped === true
            ? {
                  state: updateQueueState(withPause.state, queue, { stopped: true }),
                  execute: () => null,
              }
            : event.stopped === false
            ? {
                  state: updateQueueState(withPause.state, queue, { stopped: false }),
                  execute: () => executeNext(withPause.state, queue, callback),
              }
            : withPause;

    // clear event
    const withClear: SchedulerTask =
        event.clear === true
            ? {
                  state: updateQueueState(withStop.state, queue, { events: [], busy: false }),
                  execute: () => null,
              }
            : withStop;

    return withClear;
};

export const scheduleEvent = (
    state: SchedulerState,
    queue: string | null,
    event: SchedulerEvent,
    callback: SchedulerCb
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
        else return noTask(newState);
    }
};

export const processSchedulerEvent = (
    state: SchedulerState,
    queue: string | null,
    event: SchedulerEvent,
    callback: SchedulerCb
): SchedulerTask => {
    // update queues with start/stop/clear/pause actions
    const queueTask = mergeTasks(state, Object.keys(event.queues ?? {}), (s, q) =>
        updateQueue(s, q, event.queues![q], callback)
    );

    // force-trigger the next event
    const nextTask = executeNext(queueTask.state, queue, callback, true);
    return {
        state: nextTask.state,
        execute: () => {
            queueTask.execute();
            nextTask.execute();
        },
    };
};
