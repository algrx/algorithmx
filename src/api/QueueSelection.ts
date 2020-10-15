import { ElementFn, ElementArg } from './types';
import { DispatchEvent } from '../client/types';
import { EventCallbacks } from './utils';

interface QueueContext {
    readonly ids: ReadonlyArray<string>;
    readonly withQ?: string | number | null;
    readonly callbacks: EventCallbacks;
}

const dispatchQueueEvent = (
    context: QueueContext,
    queueEvent: NonNullable<DispatchEvent['queues']>[string]
) => {
    if (context.callbacks.dispatch) {
        context.callbacks.dispatch({
            ...(context.withQ !== undefined ? { withQ: context.withQ } : {}),
            queues: context.ids.reduce((acc, q) => ({ ...acc, [q]: queueEvent }), {}),
        });
    }
};

/**
 * A selection of event queues.
 */
export class QueueSelection {
    _selection: QueueContext;

    constructor(context: QueueContext) {
        this._selection = context;
    }

    /**
     * Pauses the queue for the given number of seconds.
     *
     * @param seconds - The duration of the pause, in seconds.
     */
    pause(seconds: number) {
        dispatchQueueEvent(this._selection, { pause: seconds });
        return this;
    }

    /**
     * Stops the execution of all scheduled events in the queue.
     */
    stop() {
        dispatchQueueEvent(this._selection, { stopped: true });
        return this;
    }

    /**
     * Starts/resumes the execution of all scheduled events in the queue.
     */
    start() {
        dispatchQueueEvent(this._selection, { stopped: false });
        return this;
    }

    /**
     * Clears all scheduled events in the queue.
     */
    clear() {
        dispatchQueueEvent(this._selection, { clear: true });
        return this;
    }
}
