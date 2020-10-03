import { NumSpec } from '../client/attributes/attr-spec';
import { InputAttr } from '../client/attributes/derived-attr';
import { ElementSpec } from '../client/attributes/components/element';

/**
 * All element IDs can be provided as a string or a number (which will be converted to a string).
 */
export type ElementId = string | number;

/**
 * A function taking a selected element's data as input. This is typically provided as an argument
 * in a selection method, allowing attributes to be configured differently for each element.
 *
 * @param ElementFn.data - The data associated with the element.
 * - If the [[ElementSelection.data]] method was used previously in the method chain, it will
 *   determine the type of data used.
 * - If the selection has no associated data, it will fall back on its parent's data (as is the case
 *   for [[LabelSelection]]).
 * - Otherwise, the information used to construct the selection will serve as its data (e.g. node ID
 *   values and edge tuples).
 *
 * @param ElementFn.index - The index of the element in the selection, beginning at 0, determined by
 * its position in the list initially used to construct the selection.
 */
export type ElementFn<T, D> = (data: D, index: number) => T;

/**
 * Allows an argument to be provided either directly, or as a function of each element's data (see
 * [[ElementFn]] and [[ElementSelection.data]]).
 */
export type ElementArg<T, D = null> = ElementFn<T, D> | T;

/**
 * A dictionary of element attributes, which is extended by nodes, edges, labels and the canvas
 * itself.
 *
 * Most attribute endpoints can be provided either as a single value, or as partial dictionary in
 * the form:
 * - `value`: The attribute value.
 * - `duration`: The duration of the animation, see [[ElementSelection.duration]].
 * - `ease`: The animation ease, see [[ElementSelection.ease]].
 * - `highlight`: Whether the change is temporary, see [[ElementSelection.highlight]].
 * - `linger`: How long a highlight should last, see [[ElementSelection.highlight]].
 *
 * Some endpoints may also contain additional properties.
 *
 * All attributes correspond directly to the available methods:
 *
 * @example
 * ```
 * node.size([20, 30])
 *     .svgattrs({ stroke: 'blue' })
 *     .duration(2.5).color('red')
 *
 * // is equivalent to
 * node.attrs({
 *    size: [20, 30],
 *    svgattrs: {
 *        stroke: 'blue'
 *    },
 *    color: {
 *        value: 'red',
 *        duration: 2.5,
 *    },
 * })
 * ```
 */
export type ElementAttrs = InputAttr<ElementSpec>;

/**
 * Numerical attributes can also provided as linear expressions in the form `mx+c`, described by
 * either an `{ m, x, c }` dictionary, or an expression string such as "-2x+8". Both `m` and `c` are
 * constants, while `x` is a variable corresponding to some other attribute. Below is a list of
 * valid variables and the context in which they can be used:
 *
 * - "cx": Half the width of the canvas.
 * - "cy": Half the height of the canvas.
 * - **nodes**
 *   - "x": Half the width of the node.
 *   - "y": Half the height of the node.
 *   - **labels**
 *     - "r": Distance from the center of the node to its boundary given the angle attribute of the
 *       label.
 */
export type NumAttr = InputAttr<NumSpec>;