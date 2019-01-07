import * as events from './types/events'
import { EnumDispatchType } from './types/events'

type Event = events.DispatchEvent
type SchedulerCallback = (event: Event, queue: string | null) => void

interface IQueueState {
  readonly events: ReadonlyArray<Event>
  readonly busy: boolean
  readonly stopped: boolean
  readonly current?: Event
}
export interface ISchedulerState {
  readonly queues: { readonly [queue: string]: IQueueState }
  readonly callback: SchedulerCallback,
  readonly stopped: boolean
}
export interface ISchedulerTask {
  readonly state: ISchedulerState
  readonly execute: () => void
}

const initQueue = (state: ISchedulerState): IQueueState => {
  return {
    events: [],
    busy: false,
    stopped: state.stopped
  }
}
export const init = (callback: SchedulerCallback): ISchedulerState => {
  return {
    callback: callback,
    queues: {},
    stopped: false
  }
}

const getQueueState = (state: ISchedulerState, queue: string): IQueueState => {
  return state.queues.hasOwnProperty(queue) ? state.queues[queue] : initQueue(state)
}
const updateQueue = (state: ISchedulerState, queue: string,
                     options: Partial<IQueueState>): ISchedulerState => {
  return {...state, queues: {...state.queues, [queue]: {...getQueueState(state, queue), ...options } } }
}

const modifyMultipleQueues = (state: ISchedulerState, queues: ReadonlyArray<string>,
                              stateFn: (state: ISchedulerState, q: string) => ISchedulerState,
                              taskFn: (state: ISchedulerState, q: string) => ISchedulerTask) => {
  return queues.reduce((resultTask, q) => {
    const newState = stateFn(resultTask.state, q)
    const task = taskFn(newState, q)
    return { state: task.state, execute: () => { task.execute(); resultTask.execute() } }
  }, { state: state, execute: () => { /**/ } })
}

export const start = (state: ISchedulerState, queues: ReadonlyArray<string> | null): ISchedulerTask => {
  const newState: ISchedulerState = queues === null ? {...state, stopped: false } : state
  const allQueues = queues === null ? Object.keys(state.queues) : queues
  return modifyMultipleQueues(newState, allQueues,
    (s, q) => updateQueue(s, q, { stopped: false }),
    (s, q) => executeNext(s, q))
}

export const stop = (state: ISchedulerState, queues: ReadonlyArray<string> | null): ISchedulerTask => {
  const newState: ISchedulerState = queues === null ? {...state, stopped: true } : state
  const allQueues = queues === null ? Object.keys(state.queues) : queues

  const finalState = allQueues.reduce((resultState, queue) =>
    updateQueue(resultState, queue, { stopped: true }), newState)
  return { state: finalState, execute: () => { /**/ } }
}

export const cancel = (state: ISchedulerState, queues: ReadonlyArray<string> | null): ISchedulerTask => {
  const newState: ISchedulerState = queues === null ? {...state, queues: {} } : state
  const allQueues = queues === null ? Object.keys(state.queues) : queues

  const finalState = allQueues.reduce((resultState, queue) =>
    updateQueue(resultState, queue,  { events: [], busy: false }), newState)
  return { state: finalState, execute: () => { /**/ } }
}

export const schedule = (state: ISchedulerState, queue: string | null, event: Event): ISchedulerTask => {
  if (queue === null) {
    // execute the event immediately if no queue is specified
    return {
      state: state,
      execute: () => state.callback(event, queue)
    }
  } else {
    const queueState = getQueueState(state, queue)
    const newState = updateQueue(state, queue, { events: queueState.events.concat([event]) })

    // only trigger event execution if the queue was previously empty
    if (queueState.events.length === 0) return executeNext(newState, queue)
    else return { state: newState, execute: () => { /**/ } }
  }
}

const executeNext = (state: ISchedulerState, queue: string, force = false): ISchedulerTask => {
  const queueState = getQueueState(state, queue)
  if (queue === null || (!force && queueState.busy)) {
    // if the queue is busy, only execute the next event when forced
    return {
      state: state,
      execute: () => { /**/ }
    }
  } else if (queueState.stopped || queueState.events.length === 0) {
    // either the queue is stopped or all events have finished, and so it is no longer busy
    return {
      state: updateQueue(state, queue, { busy: false }),
      execute: () => { /**/ }
    }
  } else if (queue === null || (!force && queueState.busy)) {
    // if the queue is busy, only execute the next event when forced
    return {
      state: state,
      execute: () => { /**/ }
    }
  } else {
    // get the next event in the queue, delay it if it is a pause event, otherwise execute it immediately
    const event = queueState.events[0]
    const executeFunc = () => {
      if (event.type === events.EnumDispatchType.pause) {
        const delay = (event as events.IDispatchEventPause).data.duration * 1000
        setTimeout(() => state.callback(event, queue), delay)
      } else state.callback(event, queue)
    }
    // pop the next event, set it as the current event, and make the queue busy
    return {
      state: updateQueue(state, queue, { events: queueState.events.slice(1), busy: true, current: event }),
      execute: executeFunc
    }
  }
}

const isQueueUpdateEvent = (event: Event): event is events.IDispatchEventQueueUpdate =>
  event.type === EnumDispatchType.start || event.type === EnumDispatchType.stop
    || event.type === EnumDispatchType.cancel

const executeQueueUpdate = (state: ISchedulerState, event: events.IDispatchEventQueueUpdate): ISchedulerTask => {
  if (event.type === EnumDispatchType.start)
    return start(state, event.data.queues)
  else if (event.type === EnumDispatchType.stop)
    return stop(state, event.data.queues)
  else
    return cancel(state, event.data.queues)
}

export const execute = (state: ISchedulerState, queue: string | null, event: Event,
                        callback: (event: Event) => void): ISchedulerTask => {
  // check if the event is valid
  if (queue === null || getQueueState(state, queue).current === event) {
    if (isQueueUpdateEvent(event)) {
        // process start, stop and cancel
        const queueTask = executeQueueUpdate(state, event)
        // force-trigger the next event
        const nextTask = executeNext(queueTask.state, queue, true)
        return {
          state: nextTask.state,
          execute: () => { queueTask.execute(); nextTask.execute() }
        }
      } else {
        // force-trigger the next event
        const nextTask = executeNext(state, queue, true)
        return {
          state: nextTask.state,
          execute: () => { callback(event); nextTask.execute() }
        }
      }
  } else return { state: state, execute: () => { /**/ } }
}
