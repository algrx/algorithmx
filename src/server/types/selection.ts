import { AnimationType, AnimationEase } from '../../client/attributes/definitions/animation'
import { InputElementAttr } from '../../client/attributes/definitions/types'
import { ElementFn, ElementArg } from './types'

export interface Selection<T extends InputElementAttr> {
  /**
   * Adds all elements in the current selection to the canvas. This should be called immediately after a
   * selection of new elements is created. If the selection contains multiple elements, they will not necessarily be
   * added in order.
   *
   * @return A new instance of the current selection with animations disabled, allowing initial attributes to be
   * configured.
   */
  add (): this

  /**
   * Removes all elements in the current selection from the canvas.
   */
  remove (): this

  /**
   * Sets one or more custom attributes on all elements in the current selection. The attributes are provided using
   * a dictionary, where each (key, value) pair corresponds to the method and argument setting the same attribute.
   * For example:
   *
   * @example
   * ```typescript
   *
   * node.color('red').size([20, 30]).svgattr('stroke', 'blue')
   * // is equivalent to
   * node.set({
   *  color: 'red',
   *  size: [20, 30],
   *  svgattr: {
   *    stroke: 'blue'
   *  }
   * })
   * ```
   *
   * @param attrs - A dictionary of custom attributes.
   */
  set (attrs: ElementArg<T>): this

  /**
   * Sets whether or not the elements in the current selection should be visible. This can be animated in the same way
   * as additions and removals. However, in contrast to removing, disabling visibility will not clear attributes or
   * affect layout.
   *
   * @param visible - Whether or not the elements should be visible.
   */
  visible (visible: ElementArg<boolean>): this

  /**
   * Sets the queue onto which all events triggered by the selection should be added. Each queue handles events
   * independently, and all queues execute in parallel. Since queues can be delayed (see [[Selection.pause]]), this
   * effectively enables multiple animations to run simultaneously.
   *
   * The `null` queue is special; all events added to it will execute immediately. The default queue is named "default".
   *
   * @param queue - The name of the queue. This can be any string or number, or `null` for the immediate
   * queue. Defaults to "default".
   *
   * @return A new instance of the current selection using the specified event queue.
   */
  eventQ (queue?: string | number | null): this

  /**
   * Configures the type of animation which should be used for all attribute changes triggered by the selection.
   *
   * @param type - One of the following strings:
   * - "normal": The standard animation, applicable in most cases.
   * - "scale": Animates the size of elements being added/removed.
   * - "fade": Animates the opacity of elements being added/removed.
   * - "scale-face": Animates both the size and opacity of elements being added/removed.
   * - "traverse": Changes the color of edges using a traversal animation.
   *
   * @return A new instance of the current selection using the specified animation type. Defaults to "normal".
   */
  animate (type: ElementArg<AnimationType>): this

  /**
   * Configures the duration of all animations triggered by the selection. A duration of `0` will ensure that changes
   * occur immediately. The default duration is `0.5`.
   *
   * @param seconds - The animation duration, in seconds.
   *
   * @return A new instance of the current selection using the specified animation duration.
   */
  duration (seconds: ElementArg<number>): this

  /**
   * Configures the ease function used in all animations triggered by the selection. This will affect the way attributes
   * transition from one value to another. More information is available here: [[https://github.com/d3/d3-ease]].
   *
   * @param ease - The name of the ease function, based on the functions found in D3. The full list is below:
   *
   * "linear",
   * "poly", "poly-in", "poly-out", "poly-in-out",
   * "quad", "quad-in", "quad-out", "quad-in-out",
   * "cubic", "cubic-in", "cubic-out", "cubic-in-out",
   * "sin", "sin-in", "sin-out", "sin-in-out",
   * "exp", "exp-in", "exp-out", "exp-in-out",
   * "circle", "circle-in", "circle-out", "circle-in-out",
   * "elastic", "elastic-in", "elastic-out", "elastic-in-out",
   * "back", "back-in", "back-out", "back-in-out",
   * "bounce", "bounce-in", "bounce-out", "bounce-in-out".
   *
   * @return A new instance of the current selection using the specified animation ease.
   */
  ease (ease: ElementArg<AnimationEase>): this

  /**
   * Returns a new selection through which all attribute changes are temporary. This is typically used to draw attention
   * to a certain element without permanently changing its attributes.
   *
   * @param seconds - The amount of time attributes should remain 'highlighted', in seconds, before
   * changing back to their original values. Defaults to `0.5`.
   *
   * @return A new instance of the current selection, where all attribute changes are temporary.
   */
  highlight (seconds?: ElementArg<number>): this

  /**
   * Binds the selection to a list of data values. This will decide the arguments provided whenever an attribute is
   * configured using a function (see [[ElementArg]]).
   *
   * @param data - A list of values to use as the data of this selection, which should have the same length as the number
   * of elements in the selection. Alternatively, a function transforming the selection's previous data.
   * Use `null` to unbind the selection from its data, in which case the selection will fall back on its parent's data.
   *
   * @return A new instance of the current selection bound to the given data.
   */
  data (data: ReadonlyArray<unknown> | ElementFn<unknown> | null): this

  /**
   * Adds a pause to the event queue, delaying the next event by the given number of seconds.
   *
   * @param seconds - The duration of the pause, in seconds.
   */
  pause (seconds: number): this

  /**
   * Stops the execution of all scheduled events on the given event queue.
   * Note that this will still be added as an event onto the current queue.
   *
   * @param queue - The ID of the queue to stop, which will be converted to a string. Defaults to "default".
   */
  stop (queue?: unknown): this

  /**
   * Stops the execution of all scheduled events on all event queues.
   * Note that this will still be added as an event onto the current queue.
   */
  stopall (): this

  /**
   * Starts/resumes the execution of all scheduled events on the given event queue.
   * Note that this will still be added as an event onto the current queue.
   *
   * @param queue - The ID of the queue to start, which will be converted to a string. Defaults to "default".
   */
  start (queue?: unknown): this

  /**
   * Starts/resumes the execution of all scheduled events on all event queues.
   * Note that this will still be added as an event onto the current queue.
   */
  startall (): this

  /**
   * Cancels all scheduled events on the given event queue.
   * Note that this will still be added as an event onto the current queue.
   *
   * @param queue - The ID of the queue to cancel, which will be converted to a string. Defaults to "default".
   */
  cancel (queue?: unknown): this

  /**
   * Cancels all scheduled events on all event queues.
   * Note that this will still be added as an event onto the current queue.
   */
  cancelall (): this

  /**
   * Adds a message to the event queue, which will trigger a corresponding listener (see [[Selection.listen]]).
   * This can be used to detect when a queue reaches a certain point in execution, or to enable communication between
   * a server.
   *
   * @param message - The message.
   */
  broadcast (message: string): this

  /**
   * Registers a function to listen for a specific broadcast message (see [[Selection.broadcast]]). The function will
   * be called when the corresponding broadcast event is processed by the event queue. If the same message is broadcast
   * multiple times, the function will be called each time. This will also override any previous function listening for
   * the same message.
   *
   * @param message - The message to listen for.
   * @param onReceive - The function to call when the message is received.
   */
  listen (message: string, onReceive: () => void): this

  /**
   * Adds a callback to the event queue. This is roughly equivalent to broadcasting a unique message and setting up
   * a corresponding listener. The callback function is guaranteed to only execute once.
   *
   * @param onCallback - The function to call when the callback event is processed by the event queue.
   */
  callback (onCallback: () => void): this
}
