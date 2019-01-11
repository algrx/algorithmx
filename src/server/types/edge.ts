import { InputEdgeAttr } from '../../client/attributes/definitions/types'
import { Curve } from '../../client/attributes/definitions/edge'
import { Selection } from './selection'
import { LabelSelection } from './label'
import { ElementArg, NumExpr } from './types'

export interface EdgeSelection extends Selection<InputEdgeAttr> {
  /**
   * Selects a single label, attached to the edge, by its ID.
   *
   * @param id - The ID of the label. Defaults to "weight".
   *
   * @return A new selection corresponding to the given label.
   */
  label (id?: string | number): LabelSelection

  /**
   * Selects multiple labels, attached to the edge, using a list of ID values.
   *
   * @param ids - A list of label IDs.
   *
   * @return A new selection corresponding to the given labels.
   */
  labels (ids: ReadonlyArray<string | number>): LabelSelection

  /**
   * Sets whether or not the edge should include an arrow pointing towards its target node.
   *
   * @param directed - True if the edge should be directed, false otherwise.
   */
  directed (directed: ElementArg<boolean>): this

  /**
   * Sets the length of the edge. This will only take effect when [[CanvasSelection.edgelengths]] is set to "individual".
   *
   * @param length - The length of the edge.
   */
  length (length: ElementArg<NumExpr>): this

  /**
   * Sets the thickness of the edge.
   *
   * @param thickness - The thickness of the edge.
   */
  thickness (thickness: ElementArg<NumExpr>): this

  /**
   * Sets color of the edge. Note that this can be animated with a traversal animation ("traverse" or
   * "traverse-reverse", see [[Selection.animate]]).
   *
   * @param color - A CSS color string.
   */
  color (color: ElementArg<string>): this

  /**
   * Sets whether or not the edge should be 'flipped' after exceeding a certain angle, such that it is never rendered
   * upside-down. This only applies to edges connecting two nodes.
   *
   * @param flip - True if the edge should flip automatically, false otherwise.
   */
  flip (flip: ElementArg<boolean>): this

  /**
   * Sets the curve function used to interpolate the edge's path. The default setting is "cardinal". More
   * information is available here: [[https://github.com/d3/d3-shape#curves]].
   *
   * @param curve - The name of the curve function, based on the functions found in D3. The full list is below:
   *
   * "basis",
   * "bundle",
   * "cardinal",
   * "catmull-rom",
   * "linear",
   * "monotone-x",
   * "monotone-y",
   * "natural",
   * "step", "step-before", "step-after"
   */
  curve (curve: ElementArg<Curve>): this

  /**
   * Sets a custom path for the edge. The path is a list of (x, y) tuples, relative to the edge's origin, which will
   * automatically connect to the boundaries of the source and target nodes.
   *
   * If the edge connects two nodes, (0, 0) will be the midpoint between the two nodes. If edge is a looping edge
   * connecting one node, (0, 0) will be a point along the node's boundary, in the direction of the edge.
   *
   * @param path - A list of (x, y) tuples.
   */
  path (path: ElementArg<ReadonlyArray<[NumExpr, NumExpr]>>): this

  /**
   * Sets a custom SVG attribute on the edge's path.
   *
   * @param key - The name of the SVG attribute.
   * @param value - The value of the SVG attribute.
   */
  svgattr (key: string, value: ElementArg<string | number | null>): this
}
