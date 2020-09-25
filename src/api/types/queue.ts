import { ElementFn, ElementArg } from '../types';

export interface QueueSelection {
    /**
     * Pauses the queue for the given number of seconds.
     *
     * @param seconds - The duration of the pause, in seconds.
     */
    pause(seconds: number): this;

    /**
     * Stops the execution of all scheduled events on the given event queue.
     * Note that this will still be added as an event onto the current queue.
     *
     */
    stop(): this;

    /**
     * Starts/resumes the execution of all scheduled events on the given event queue.
     * Note that this will still be added as an event onto the current queue.
     */
    start(): this;

    /**
     * Clears all scheduled queue events.
     *
     * @param queue - The ID of the queue to cancel, which will be converted to a string. Defaults to "default".
     */
    clear(): this;
}
