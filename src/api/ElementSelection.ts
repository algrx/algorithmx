import { InputAttr } from '../client/attributes/derived';
import { ElementSpec } from '../client/attributes/components/element';
import { AnimEase } from '../client/attributes/components/animation';

import { ElementArg, ElementFn } from './types';
import {
    ElementContext,
    ElementObjArg,
    applyAttrs,
    evalElementValue,
    evalElementDict,
} from './utils';
import { Canvas } from './Canvas';

export type ElementAttrs = InputAttr<ElementSpec>;

/**
 * A selection of elements. Inherited by nodes, edges, labels and the canvas itself.
 */
export class ElementSelection<T extends ElementAttrs, D> {
    _selection: ElementContext<D>;

    ['constructor']: typeof ElementSelection;

    constructor(context: ElementContext<D>) {
        this._selection = context;
    }

    /**
     * Applies a dictionary of attributes to all selected elements.
     *
     * All attributes correspond to the available methods. Most attribute endpoints can be provided
     * either as a single value, or as partial dictionary in the form:
     * - value: The attribute value.
     * - duration: The duration of the animation, see [[ElementSelection.duration]].
     * - ease: The animation ease, see [[ElementSelection.ease]].
     * - highlight: Whether the change is temporary, see [[ElementSelection.highlight]].
     * - linger: How long a highlight should last, see [[ElementSelection.highlight]].
     * - (animtype, etc.): Additional attribute-specific properties.
     *
     * The whole dictionary, or any of its direct entries, can be provided as an [[ElementFn]].
     *
     * @example
     * ```
     * nodes.size([20, 30])
     *     .pos((_, i) => [i * 10, 0])
     *     .svgattr("stroke", "blue")
     *     .duration(2.5).color("red")
     *
     * // is equivalent to
     * node.attrs({
     *    size: [20, 30],
     *    pos: (_, i) => [i * 10, 0],
     *    svgattrs: { stroke: "blue" },
     *    color: {
     *        value: "red",
     *        duration: 2.5,
     *    },
     * })
     * ```
     *
     * @param attrs - An attribute dictionary.
     */
    attrs(attrs: ElementObjArg<T, D>): this {
        applyAttrs(this._selection, (d, i) => evalElementDict(attrs, d, i));
        return this;
    }

    /**
     * Adds all selected elements to the canvas with the given initial attributes.
     *
     * @param attrs - An attribute dictionary, see [[ElementSelection.attrs]].
     *
     * @return A new instance of the current selection with animations disabled, to allow for
     * further attribute initialisation.
     */
    add(attrs?: ElementObjArg<T, D>) {
        return this.attrs((d, i) => (attrs ? evalElementDict(attrs, d, i) : ({} as T))).duration(0);
    }

    /**
     * Removes all selected elements, resetting their attributes and layout state.
     */
    remove() {
        return this.attrs({ remove: true } as T);
    }

    /**
     * Sets whether or not the selected elements should be visible. In contrast to removing,
     * visibility will not reset attributes or layout state.
     *
     * @param value - Whether or not the selected elements should be visible.
     */
    visible(visible: ElementArg<boolean, D>) {
        return this.attrs({ visible } as T);
    }

    /**
     * Sets a custom SVG attribute on the element. The root SVG tag is `<shape>` for nodes, `<path>`
     * for edges, `<text>` for labels, and `<svg>` for the canvas.
     *
     * Note that when using [[ElementSelection.attrs]], SVG attributes should be provided as a
     * dictionary under the key `svgattrs`.
     *
     * @param key - The name of the SVG attribute.
     *
     * @param value - The value of the SVG attribute.
     */
    svgattr(key: string, value: ElementArg<string | number, D>) {
        return this.attrs((d, i) => ({ svgattrs: { [key]: evalElementValue(value, d, i) } } as T));
    }

    /**
     * Sets the event queue to use for all events triggered by the selection. Each queue handles
     * events independently, and all queues execute in parallel, which enables multiple animations
     * to run simultaneously.
     *
     * The `null` queue is special; all events added to it will execute immediately. The default
     * queue has ID 0.
     *
     * @param queue - The name of the queue. This can be any string or number, or `null` for the
     * immediate queue. Defaults to 0.
     *
     * @return A new instance of the current selection using the given queue.
     */
    withQ(queue: string | number | null = 0): this {
        return new this.constructor({
            ...this._selection,
            withQ: typeof queue === 'number' ? String(queue) : queue,
        }) as this;
    }

    /**
     * Configures the duration of all animations triggered by the selection. A duration of 0 will
     * ensure that changes occur immediately. The default duration is usually 0.5.
     *
     * @param seconds - The animation duration, in seconds.
     *
     * @return A new instance of the current selection using the given animation duration.
     */
    duration(seconds: number): this {
        return new this.constructor({
            ...this._selection,
            animation: {
                ...this._selection.animation,
                duration: seconds,
            },
        }) as this;
    }

    /**
     * Configures the ease function used in all animations triggered by the selection. This will
     * affect the way attributes transition from one value to another. More information is available
     * here: [[https://github.com/d3/d3-ease]].
     *
     * @param ease - The name of the ease function, based on the functions found in D3. The full
     * list is below:
     *
     * "linear", "poly", "poly-in", "poly-out", "poly-in-out", "quad", "quad-in", "quad-out",
     * "quad-in-out", "cubic", "cubic-in", "cubic-out", "cubic-in-out", "sin", "sin-in", "sin-out",
     * "sin-in-out", "exp", "exp-in", "exp-out", "exp-in-out", "circle", "circle-in", "circle-out",
     * "circle-in-out", "elastic", "elastic-in", "elastic-out", "elastic-in-out", "back", "back-in",
     * "back-out", "back-in-out", "bounce", "bounce-in", "bounce-out", "bounce-in-out".
     *
     * @return A new instance of the current selection using the given animation ease.
     */
    ease(ease: AnimEase): this {
        return new this.constructor({
            ...this._selection,
            animation: {
                ...this._selection.animation,
                ease: ease,
            },
        }) as this;
    }

    /**
     * Returns a new selection through which all attribute changes are temporary. This is typically
     * used to draw attention to a certain element without permanently changing its attributes.
     *
     * @param seconds - The amount of time attributes should remain 'highlighted', in seconds,
     * before changing back to their original values. Defaults to 0.5.
     *
     * @return A new instance of the current selection, where all attribute changes are temporary.
     */
    highlight(seconds?: number): this {
        return new this.constructor({
            ...this._selection,
            animation: {
                ...this._selection.animation,
                highlight: true,
                ...(seconds !== undefined ? { linger: seconds } : {}),
            },
        }) as this;
    }

    /**
     * Adds a pause to the current event queue. The pause will only start once all previous pauses
     * have finished. This is a shortcut for [[QueueSelection.pause]].
     *
     * @param seconds - The duration of the pause, in seconds.
     */
    pause(seconds: number) {
        if (this._selection.withQ !== null && this._selection.callbacks.dispatch) {
            this._selection.callbacks.dispatch({
                queues: { [this._selection.withQ ?? 0]: { pause: seconds } },
                withQ: this._selection.withQ ?? 0,
            });
        }
        return this;
    }

    /**
     * Binds the selection to a list of data values. This will determine the data argument to
     * provide whenever an [[ElementFn]] is used.
     *
     * You can also provide a function to map the current data list to a new one.
     *
     * @param data - Either a list of data values (which must have the same length as the number of
     * elements in the selection), or a function which maps the current data list.
     *
     * @return A new instance of the current selection bound to the given data.
     */
    data<ND>(data: ReadonlyArray<ND> | ElementFn<ND, D>): ElementSelection<T, ND> {
        return new this.constructor({
            ...this._selection,
            data: Array.isArray(data)
                ? data
                : this._selection.data &&
                  this._selection.data.map((d, i) =>
                      evalElementValue(data as ElementFn<ND, D>, d, i)
                  ),
        });
    }
}
