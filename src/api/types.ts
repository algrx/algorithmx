import { NumSpec } from '../client/attributes/spec';
import { InputAttr } from '../client/attributes/derived';
import { ElementSpec } from '../client/attributes/components/element';

/**
 * An ID value, which will be converted to a string.
 */
export type AnyId = unknown;

/**
 * A function taking a selected element's data as and index input.
 *
 * This is typically provided as an argument in a selection method, allowing attributes to be
 * configured differently for each element.
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
 * A numerical attribute, which can also provided as a linear expression.
 *
 * Expressions can be provided as an `{ m, x, c }` dictionary, or as an expression string such as
 * "-2x+8". Both `m` and `c` are constants, while `x` is a variable corresponding to some other
 * attribute. Below is a list of valid variables and the context in which they can be used:
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
