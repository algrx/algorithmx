import * as events from './types/events'
import { EnumDispatchType } from './types/events'

type Event = events.DispatchEvent
type EventQueue = Event['queue']
type SchedulerCallback = (event: Event, queue: EventQueue) => void

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

const startAllQueues = (state: ISchedulerState): ISchedulerTask => {
  return Object.keys(state.queues).reduce((resultTask, queue) => {
    const newState = updateQueue(resultTask.state, queue, { stopped: false })
    const task = executeNext(newState, queue)
    return { state: task.state, execute: () => { task.execute(); resultTask.execute() } }
  }, { state: state, execute: () => { /**/ } })
}

const stopAllQueues = (state: ISchedulerState): ISchedulerState => {
  return Object.keys(state.queues).reduce((resultState, queue) => {
    return updateQueue(resultState, queue, { stopped: true })
  }, state)
}

export const start = (state: ISchedulerState, queue: EventQueue): ISchedulerTask => {
  const newState: ISchedulerState = queue === null ? {...state, stopped: false }
    : updateQueue(state, queue, { stopped: false })
  if (queue === null) return startAllQueues(newState)
  else return executeNext(newState, queue)
}

export const stop = (state: ISchedulerState, queue: EventQueue): ISchedulerTask => {
  const newState: ISchedulerState = queue === null ? stopAllQueues({...state, stopped: true })
    : updateQueue(state, queue, { stopped: true })
  return { state: newState, execute: () => { /**/ } }
}

export const cancel = (state: ISchedulerState, queue: EventQueue): ISchedulerTask => {
  const newState: ISchedulerState = queue === null ? {...state, queues: {} }
    : updateQueue(state, queue, { events: [], busy: false })
  return { state: newState, execute: () => { /**/ } }
}

export const schedule = (state: ISchedulerState, queue: EventQueue, event: Event): ISchedulerTask => {
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
      if (event.type === events.EnumDispatchType.pause)
        setTimeout(() => state.callback(event, queue), (event as events.IDispatchEventPause).data.duration)
      else state.callback(event, queue) // setTimeout(() => state.callback(event, queue), 1)
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
    return start(state, event.data.queue)
  else if (event.type === EnumDispatchType.stop)
    return stop(state, event.data.queue)
  else
    return cancel(state, event.data.queue)
}

export const execute = (state: ISchedulerState, queue: string, event: Event,
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
