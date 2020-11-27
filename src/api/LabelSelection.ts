import { InputAttr } from '../client/attributes/derived';
import { LabelSpec, LabelAlign } from '../client/attributes/components/label';

import { ElementSelection } from './ElementSelection';
import { ElementArg, NumAttr } from './types';

export type LabelAttrs = InputAttr<LabelSpec>;

/**
 * A selection of labels.
 */
export class LabelSelection<D> extends ElementSelection<LabelAttrs, D> {
    /**
     * Sets the text displayed by the label.
     *
     * The newline character ("\n") can be used to break the text into multiple lines.
     *
     * @param text - The text displayed by the label.
     */
    text(text: ElementArg<string | number, D>) {
        return this.attrs({ text });
    }

    /**
     * Sets alignment of the label's text.
     *
     * This will affect the direction in which text is appended, as well as its positioning relative
     * to the label's base position. For example, an alignment of "top-left" will ensure that the
     * top left corner of the label is located at the base position.
     *
     * A special "radial" alignment can be used to dynamically calculate the label's alignment based
     * on its [[LabelSelection.angle]] and [[LabelSelection.rotate]] attributes, such that text is
     * optimally positioned around an element.
     *
     * @param align - A string describing the alignment, typically in the form
     * "vertical-horizontal". The full list is below:
     *
     * "top-left", "top-middle", "top-right", "middle-left", "middle", "middle-right",
     * "bottom-left", "bottom-middle", "bottom-right", "radial"
     */
    align(align: ElementArg<LabelAlign, D>) {
        return this.attrs({ align });
    }

    /**
     * Sets the position of the label relative to its parent element.
     *
     * If the parent is a node, (0,0) will be the node's center. If the parent is an edge connecting
     * two nodes, (0,0) will be the midpoint between the two nodes. If the parent is a looping edge
     * connecting one node, (0,0) will be a point on the node's boundary.
     *
     * @param pos - An (x, y) tuple describing the position of the label.
     */
    pos(pos: ElementArg<[NumAttr, NumAttr], D>) {
        return this.attrs({ pos });
    }

    /**
     * Positions the label using polar coordinates, together with [[LabelSelection.angle]]. This
     * will specify the distance from the label's base position (see [[LabelSelection.pos]]).
     *
     * @param radius - The polar radius, defined as the distance from the label's base position.
     */
    radius(radius: ElementArg<NumAttr, D>) {
        return this.attrs({ radius });
    }

    /**
     * Allows the label to be positioned using polar coordinates, together with the
     * [[LabelSelection.radius]] attribute. This will specify the angle, in degrees, along a
     * standard unit circle centered at the label's base position (see [[LabelSelection.pos]]).
     *
     * This will also affect the rotation of the label if [[LabelSelection.rotate]]) is enabled.
     *
     * @param angle - The polar angle, in degrees, increasing counter-clockwise from the x-axis.
     */
    angle(angle: ElementArg<NumAttr, D>) {
        return this.attrs({ angle });
    }

    /**
     * Sets whether the label should be rotated by [[LabelSelection.angle]] degrees.
     *
     * The exact rotation will also depend on the label's alignment. For example, an alignment of
     * "top-center" together with an angle of 90 degrees will result in the text being upside-down.
     *
     * @param rotate - True if the label should be rotated.
     */
    rotate(rotate: ElementArg<boolean, D>) {
        return this.attrs({ rotate });
    }

    /**
     * Sets the color of the label's text.
     *
     * The default color is "gray" in most cases.
     *
     * @param color - A CSS color string.
     */
    color(color: ElementArg<string, D>) {
        return this.attrs({ color });
    }

    /**
     * Sets the font of the label's text.
     *
     * @param font - A CSS font-family string.
     */
    font(font: ElementArg<string, D>) {
        return this.attrs({ font });
    }

    /**
     * Sets the size of the label's text.
     *
     * @param size - The size of the label's text, in pixels.
     */
    size(size: ElementArg<NumAttr, D>) {
        return this.attrs({ size });
    }

    data<ND>(data: ReadonlyArray<ND>): LabelSelection<ND> {
        return super.data(data) as LabelSelection<ND>;
    }
}
