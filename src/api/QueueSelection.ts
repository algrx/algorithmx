import { ElementFn, ElementArg } from './types';
import { EventHandler } from './event-handler';
import { DispatchEvent } from '../client/types';

interface QueueContext {
    readonly queues: ReadonlyArray<string | number>;
    readonly withQ?: string | number | null;
    readonly root: EventHandler;
}

const dispatchQueueEvent = (
    selection: QueueContext,
    queueEvent: NonNullable<DispatchEvent['queues']>[string]
) => {
    selection.root.dispatch({
        ...(selection.withQ !== undefined ? { withQ: selection.withQ } : {}),
        queues: selection.queues.reduce((acc, q) => ({ ...acc, [String(q)]: queueEvent }), {}),
    });
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
        dispatchQueueEvent(this._selection, { action: 'pause', duration: seconds });
        return this;
    }

    /**
     * Stops the execution of all scheduled events in the queue.
     */
    stop() {
        dispatchQueueEvent(this._selection, { action: 'stop' });
        return this;
    }

    /**
     * Starts/resumes the execution of all scheduled events in the queue.
     */
    start() {
        dispatchQueueEvent(this._selection, { action: 'start' });
        return this;
    }

    /**
     * Clears all scheduled events in the queue.
     */
    clear() {
        dispatchQueueEvent(this._selection, { action: 'clear' });
        return this;
    }
}
