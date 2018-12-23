import { Selection } from './selection'
import { ElementArg, NumExpr, ElementFn } from './types'
import { Align } from '../../client/attributes/definitions/label'

export interface LabelSelection extends Selection {

  text (text: ElementArg<string>): this

  /**
   * Sets alignment of the label's text.
   *
   * @param align An (x, y) tuple describing the position of the label.
   */
  align (pos: ElementArg<Align>): this

  /**
   * Sets the position of the the label relative to its parent element. This will always involve a Cartesian coordinate
   * system. If the parent is a node, (0, 0) will be its center. If the parent is an edge connecting two nodes, (0, 0)
   * will be the midpoint between the two nodes. If the parent is a looping edge connecting one node, (0, 0) will be the
   * center of the connected node.
   *
   * @param pos An (x, y) tuple describing the position of the label.
   */
  pos (pos: ElementArg<[NumExpr, NumExpr]>): this

  /**
   * Allows the label to be positioned using polar coordinates, together with the [[LabelSelection.angle]] attribute.
   * This will specify the distance from the label's base position (see [[LabelSelection.pos]]).
   *
   * @param radius The polar radius, defined as the distance from the node's base position.
   */
  radius (radius: ElementArg<NumExpr>): this

  /**
   * Allows the label to be positioned using polar coordinates, together with the [[LabelSelection.radius]] attribute.
   * This will specify the angle, in degrees, along a standard unit circle centered at the label's base position
   * (see [[LabelSelection.pos]]).
   *
   * Additionally, this will affect the rotation of the label, if enabled (see [[LabelSelection.rotate]]).
   *
   * @param angle The polar angle, in degrees, increasing counter-clockwise from the x-axis.
   */
  angle (angle: ElementArg<NumExpr>): this

  rotate (boolean: ElementArg<boolean>): this

  color (boolean: ElementArg<string>): this

  font (boolean: ElementArg<string>): this

  size (boolean: ElementArg<number>): this
}
