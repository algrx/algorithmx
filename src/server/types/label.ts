import { Selection } from './selection'
import { ElementArg, NumExpr } from './types'
import { Align } from '../../client/attributes/definitions/label'

export interface LabelSelection extends Selection {
  /**
   * Sets the text displayed by the label. The newline character ("\n") can be used to break the text into multiple lines.
   *
   * @param text - The text displayed by the label.
   */
  text (text: ElementArg<string>): this

  /**
   * Sets alignment of the label's text. This will affect the direction in which text is appended, as well as its
   * positioning relative to the label's base position. For example, an alignment of "top-left" will ensure that the top
   * left corner of the label is located at its base position.
   *
   * A special "radial" alignment can be used to dynamically calculate the label's alignment based on its [[LabelSelection.angle]]
   * and [[LabelSelection.rotate]] attributes, such that text is optimally positioned around an element.
   *
   * @param align - A string describing the alignment, typically in the form "vertical-horizontal". The full list is below:
   * "top-left", "top-center", "top-right",
   * "center-left", "center", "center-right",
   * "bottom-left", "bottom-center", "bottom-right",
   * "radial".
   */
  align (align: ElementArg<Align>): this

  /**
   * Sets the position of the the label relative to its parent element. This will always involve a Cartesian coordinate
   * system. If the parent is a node, (0, 0) will be its center. If the parent is an edge connecting two nodes, (0, 0)
   * will be the midpoint between the two nodes. If the parent is a looping edge connecting one node, (0, 0) will be a
   * point along the node's boundary, in the direction of the edge.
   *
   * @param pos - An (x, y) tuple describing the position of the label.
   */
  pos (pos: ElementArg<[NumExpr, NumExpr]>): this

  /**
   * Allows the label to be positioned using polar coordinates, together with the [[LabelSelection.angle]] attribute.
   * This will specify the distance from the label's base position (see [[LabelSelection.pos]]).
   *
   * @param radius - The polar radius, defined as the distance from the label's base position.
   */
  radius (radius: ElementArg<NumExpr>): this

  /**
   * Allows the label to be positioned using polar coordinates, together with the [[LabelSelection.radius]] attribute.
   * This will specify the angle, in degrees, along a standard unit circle centered at the label's base position
   * (see [[LabelSelection.pos]]).
   *
   * Additionally, this will affect the rotation of the label, if enabled (see [[LabelSelection.rotate]]).
   *
   * @param angle - The polar angle, in degrees, increasing counter-clockwise from the x-axis.
   */
  angle (angle: ElementArg<NumExpr>): this

  /**
   * Sets whether or not the label should rotate, using its [[LabelSelection.angle]] attribute. The exact rotation
   * will also depend on the label's alignment. For example, an alignment of "top-center" together with an angle of 90
   * degrees will result in the text being upside-down.
   *
   * @param rotate - Whether or not the label should rotate.
   */
  rotate (rotate: ElementArg<boolean>): this

  /**
   * Sets the color of the label's text.
   *
   * @param color - A CSS color string.
   */
  color (color: ElementArg<string>): this

  /**
   * Sets the font of the label's text.
   *
   * @param font - A CSS font-family string.
   */
  font (font: ElementArg<string>): this

  /**
   * Sets size of the label's text.
   *
   * @param size - A CSS font-size string (e.g. "2em"), or a number specifying the font size in pixels.
   */
  size (size: ElementArg<string | number>): this
}
