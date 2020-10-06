import { CommonSpec } from '../client/attributes/components/common';
import { InputAttr } from '../client/attributes/derived-attr';
import { ElementSpec, VisibleAnimType } from '../client/attributes/components/element';
import { AnimEase } from '../client/attributes/components/animation';

import { ElementArg, ElementFn, ElementAttrs } from './types';
import {
    EventHandler,
    applyAttrs,
    ElementObjArg,
    evalElementObjArg,
    evalElementArg,
} from './utils';

export interface ElementParent {
    readonly key: string;
    readonly selection: ElementSelection<ElementAttrs, unknown>;
    readonly root: EventHandler;
}

export interface ElementContext<D> {
    readonly ids: ReadonlyArray<string>;
    readonly data?: ReadonlyArray<D>;
    readonly withQ?: string | null;
    readonly defaultattr?: InputAttr<CommonSpec>;
    readonly parent?: ElementParent;
}

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
     * Applies a dictionary of attributes on all selected elements. The whole dictionary, or any of
     * its direct entries, can also be provided as an [[ElementFn]].
     *
     * @param attrs - An attribute dictionary, see [[ElementAttrs]].
     */
    attrs(attrs: ElementObjArg<T, D>): this {
        applyAttrs(this._selection, (d, i) => evalElementObjArg(attrs, d, i));
        return this;
    }

    /**
     * Adds all selected elements to the canvas with the given initial attributes.
     *
     * @param attrs - An attribute dictionary, see [[ElementAttrs]].
     * @param animtype - "fade" (animate transparancy) or "scale" (animate size).
     *
     * @return A new instance of the current selection with animations disabled, to allow for
     * further attribute initialisation.
     */
    add(attrs?: ElementObjArg<T, D>, animtype?: ElementArg<VisibleAnimType, D>) {
        applyAttrs(this._selection, (d, i) => {
            const initAttrs = attrs ? evalElementArg(attrs, d, i) : ({} as T);
            return {
                ...(animtype ? { visible: { animtype: evalElementArg(animtype, d, i) } } : {}),
                ...initAttrs,
            } as T;
        });

        return this.duration(0);
    }

    /**
     * Removes all selected elements, resetting their attributes and layout state.
     *
     * @param animtype - "fade" (animate transparancy) or "scale" (animate size).
     */
    remove(animtype?: ElementArg<VisibleAnimType, D>) {
        if (animtype)
            return this.attrs(
                (d, i) =>
                    ({
                        visible: { animtype: evalElementArg(animtype, d, i) },
                    } as T)
            );
        else return this.attrs({} as T);
    }

    /**
     * Sets whether or not the selected elements should be visible. In contrast to removing,
     * visibility will not reset attributes or layout state.
     *
     * @param value - Whether or not the selected elements should be visible.
     * @param animtype - "fade" (animate transparancy) or "scale" (animate size).
     */
    visible(visible: ElementArg<boolean, D>, animtype?: ElementArg<VisibleAnimType, D>) {
        return this.attrs(
            (d, i) =>
                ({
                    visible: {
                        value: evalElementArg(visible, d, i),
                        ...(animtype ? { animtype: evalElementArg(animtype, d, i) } : {}),
                    },
                } as T)
        );
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
        return this.attrs((d, i) => ({ svgattrs: { [key]: evalElementArg(value, d, i) } } as T));
    }

    /**
     * Sets the event queue to use for all events triggered by the selection. Each queue handles
     * events independently, and all queues execute in parallel, which enables multiple animations
     * to run simultaneously.
     *
     * The `null` queue is special; all events added to it will execute immediately. The default
     * queue ID is 0.
     *
     * @param queue - The name of the queue. This can be any string or number, or `null` for the
     * immediate queue.
     *
     * @return A new instance of the current selection using the given queue.
     */
    withQ(queue: string | number | null): this {
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
            defaultattr: {
                ...this._selection.defaultattr,
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
            defaultattr: {
                ...this._selection.defaultattr,
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
            defaultattr: {
                ...this._selection.defaultattr,
                highlight: true,
                linger: seconds,
            },
        }) as this;
    }

    /**
     * Pauses the current event queue for the given number of seconds. This is a convenience
     * shortcut for [[QueueSelection.pause]].
     *
     * @param seconds - The duration of the pause, in seconds.
     */
    pause(seconds: number) {
        this._selection.parent!.selection.pause(seconds);
        return this;
    }

    /**
     * Binds the selection to a list of data values. This will determine the data argument to
     * provide whenever an [[ElementFn]] is used.
     *
     * @param data - A list of values, which must have the same length as the number of elements in
     * the selection.
     *
     * @return A new instance of the current selection bound to the given data.
     */
    data<ND>(data: ReadonlyArray<ND>): ElementSelection<T, ND> {
        return new this.constructor({
            ...this._selection,
            data,
        });
    }
}
