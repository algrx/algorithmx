import { Shape } from '../../client/attributes/definitions/node'
import { InputNodeAttr } from '../../client/attributes/definitions/types'
import { Selection } from './selection'
import { LabelSelection } from './label'
import { ElementArg, NumExpr, ElementFn } from './types'

export interface NodeSelection extends Selection<InputNodeAttr> {
  /**
   * Removes all nodes in the current selection from the canvas. Additionally, removes any edges connected to the nodes.
   */
  remove (): this

  /**
   * Selects a single label, attached to the node, by its ID.
   *
   * By default, each node is initialized with a "value" label, located at the center of the node and displaying its ID.
   * Any additional labels will be automatically positioned along the boundary of the node.
   *
   * @param id - The ID of the label. Defaults to "value".
   *
   * @return A new selection corresponding to the given label.
   */
  label (id?: string | number): LabelSelection

  /**
   * Selects multiple labels, attached to the node, using a list of ID values.
   *
   * @param ids - A list of label IDs.
   *
   * @return A new selection corresponding to the given labels.
   */
  labels (ids: ReadonlyArray<string | number>): LabelSelection

  /**
   * Sets the shape of the node. Note that shape cannot be animated or highlighted.
   *
   * @param shape - One of the following strings:
   * - "circle": Standard circular node with a single radius dimension.
   * - "rect": Rectangular node with separate width and height dimensions, and corner rounding.
   * - "ellipse": Elliptical node with width and height dimensions.
   */
  shape (shape: ElementArg<Shape>): this

  /**
   * Sets the rounding of the node's corners. This only applies to rectangular nodes.
   *
   * @param radius - The radial corner rounding.
   */
  corners (radius: ElementArg<NumExpr>): this

  /**
   * Sets the color of the node.
   *
   * @param color - A CSS color string.
   */
  color (color: ElementArg<string>): this

  /**
   * Sets the size of the node. If the node is a circle, a single radius value is sufficient.
   * Otherwise, a tuple containing both the horizontal and vertical radius should be provided.
   *
   * Note that size can be set relative to the node's current size using string expressions, e.g. "1.5x" for circles
   * or ["1.5x", "1.5y"] for rectangles and other shapes.
   *
   * @param size - The radius of the node, or a (width/2, height/2) tuple.
   */
  size (size: ElementArg<NumExpr | [NumExpr, NumExpr]>): this

  /**
   * Sets the position of the node. The canvas uses a Cartesian coordinate system with (0, 0) at the center.
   *
   * @param pos - An (x, y) tuple describing the new position of the node.
   */
  pos (pos: ElementArg<[NumExpr, NumExpr]>): this

  /**
   * When set to true, this prevents the node from being automatically moved during the layout process.
   * This does not affect manual dragging.
   *
   * @param fixed - True if the position of the node should be fixed, false otherwise.
   */
  fixed (fixed: ElementArg<boolean>): this

  /**
   * Sets whether or not the node can be manually dragged around.
   *
   * @param draggable - True if the node should be draggable, false otherwise.
   */
  draggable (draggable: ElementArg<boolean>): this

  /**
   * Registers a function to listen for node click events.
   *
   * @param onClick - A function taking the node's data (see [[Selection.data]]) and, optionally, index.
   */
  click (onClick: ElementFn<void>): this

  /**
   * Registers a function to listen for node mouse-over events, triggered when the mouse enters the node.
   *
   * @param onHoverin - A function taking the node's data (see [[Selection.data]]) and, optionally, index.
   */
  hoverin (onHoverin: ElementFn<void>): this

  /**
   * Registers a function to listen for node mouse-over events, triggered when the mouse leaves the node.
   *
   * @param onHoverout - A function taking the node's data (see [[Selection.data]]) and, optionally, index.
   */
  hoverout (onHoverout: ElementFn<void>): this

  /**
   * Sets a custom SVG attribute on the node's shape.
   *
   * @param key - The name of the SVG attribute
   * @param value - The value of the SVG attribute.
   */
  svgattr (key: string, value: ElementArg<string | number | null>): this

  /**
   * Sets a custom CSS attribute on the node's shape.
   *
   * @param key - The name of the CSS attribute
   * @param value - The value of the CSS attribute.
   */
  cssattr (key: string, value: ElementArg<string | number | null>): this
}
