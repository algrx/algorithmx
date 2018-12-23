import * as events from './types/events'

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

const initQueue = (): IQueueState => ({
  events: [],
  busy: false,
  stopped: false
})
export const initScheduler = (callback: SchedulerCallback): ISchedulerState => ({
  callback: callback,
  queues: {},
  stopped: false
})

const getQueueState = (state: ISchedulerState, queue: string): IQueueState => {
  return state.queues.hasOwnProperty(queue) ? state.queues[queue] : initQueue()
}
const updateQueue = (state: ISchedulerState, queue: string,
                     options: Partial<IQueueState>): ISchedulerState => {
  return {...state, queues: {...state.queues, [queue]: {...getQueueState(state, queue), ...options } } }
}

const startAllQueues = (state: ISchedulerState): ISchedulerTask => {
  return Object.keys(state.queues).reduce((resultTask, id) => {
    const task = executeNext(resultTask.state, id)
    return { state: task.state, execute: () => { task.execute(); resultTask.execute() } }
  }, { state: state, execute: () => { /**/ } })
}

export const start = (state: ISchedulerState, queue: EventQueue): ISchedulerTask => {
  const newState: ISchedulerState = queue === null ? {...state, stopped: false }
    : updateQueue(state, queue, { stopped: false })
  if (queue === null) return startAllQueues(state)
  else return executeNext(newState, queue)
}

export const stop = (state: ISchedulerState, queue: EventQueue): ISchedulerTask => {
  const newState: ISchedulerState = queue === null ? {...state, stopped: true }
    : updateQueue(state, queue, { stopped: true, busy: false })
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
  if (state.stopped || queue === null || queueState.stopped || (!force && queueState.busy)) {
    // if the queue is busy, only execute the next event when forced
    return {
      state: state,
      execute: () => { /**/ }
    }
  } else if (queueState.events.length === 0) {
    // all events have finished, the queue is no longer busy
    return {
      state: updateQueue(state, queue, { busy: false }),
      execute: () => { /**/ }
    }
  } else {
    // get the next event in the queue, delay it if it is a pause event, otherwise execute it immediately
    const event = queueState.events[0]
    const executeFunc = () => {
      if (event.type === events.DispatchEventType.Pause)
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

export const execute = (state: ISchedulerState, queue: string, event: Event,
                        callback: (event: Event) => void) => {
  if (queue === null || getQueueState(state, queue).current === event) {
    // check if the event is valid, force-trigger the next event
    const nextTask = executeNext(state, queue, true)
    return {
      state: nextTask.state,
      execute: () => { callback(event); nextTask.execute() }
    }
  } else return { state: state, execute: () => { /**/ } }
}
