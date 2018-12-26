import { Selection } from './selection'
import { NumExpr } from './types'
import { NodeSelection } from './node'
import { EdgeSelection } from './edge'
import { LabelSelection } from './label'
import { EdgeLengthType } from '../../client/attributes/definitions/canvas'
import { EventHandler } from './events'

export interface CanvasSelection extends Selection, EventHandler {
  /**
   * Selects a single node by its ID.
   *
   * @param id - The ID of the node.
   *
   * @return A new selection corresponding to the given node.
   */
  node (id: string | number): NodeSelection

  /**
   * Selects multiple nodes using an list of ID values.
   *
   * @param ids - An list of node IDs.
   *
   * @return A new selection corresponding to the given nodes.
   */
  nodes (ids: ReadonlyArray<string | number>): NodeSelection

  /**
   * Selects a single edge by its source, target, and optional ID. The additional ID value will distinguish edges
   * connected to the same nodes. Once the edge has been added, source and target nodes can be provided in any order.
   *
   * @param edge - A (source, target) or (source, target, ID) tuple.
   *
   * @return A new selection corresponding to the given edge.
   */
  edge (edge: [string | number, string | number, (string | number)?]): EdgeSelection

  /**
   * Selects multiple edges using a list of source, target, and optional ID tuples.
   *
   * @param ids - An array of (source, target) or (source, target, ID) tuples.
   *
   * @return A new selection corresponding to the given edges.
   */
  edges (edges: ReadonlyArray<[string | number, string | number, (string | number)?]>): EdgeSelection

  /**
   * Selects a single label, attached to the canvas, by its ID.
   *
   * @param id - (Optional) The ID of the label. Defaults to "title".
   *
   * @return A new selection corresponding to the given label.
   */
  label (id?: string | number): LabelSelection

  /**
   * Selects multiple labels, attached to the canvas, using an array of ID values.
   *
   * @param ids - An array of labels IDs.
   *
   * @return A new selection corresponding to the given labels.
   */
  labels (ids: ReadonlyArray<string | number>): LabelSelection

  /**
   * Resets the canvas to its initial state, clearing all graphics and scheduled events.
   */
  reset (): this

  /**
   * Sets the width and height of the canvas. This will only updated the `width` and `height` attributes of the SVG
   * element displaying the canvas, not the enclosing HTML element.
   *
   * @param size - A (width, height) tuple describing the size of the canvas.
   */
  size (size: [NumExpr, NumExpr]): this

  /**
   * Sets method used to calculate edge lengths. Edges can either specify individual length values (see [[EdgeSelection.length]]),
   * or have their lengths dynamically calculated, in which case an 'average length' value can be provided.
   * More information is available here: [[https://github.com/tgdwyer/WebCola/wiki/link-lengths]].
   *
   * The default setting is: (type="jaccard", average length=70).
   *
   * @param lengthInfo - Either a single string describing the edge length type, or a (type, average length) tuple.
   * The valid edge length types are:
   * - "individual": Uses each edge's length attribute individually.
   * - "jaccard", "symmetric": Dynamic calculation using an 'average length' value.
   */
  edgeLengths (lengthInfo: EdgeLengthType): this

  /**
   * Sets the location of the canvas camera. The canvas uses a Cartesian coordinate system with (0, 0) at the center.
   *
   * @param location - An (x, y) tuple describing the new pan location.
   */
  pan (location: [NumExpr, NumExpr]): this

  /**
   * Sets the zoom level of the canvas camera. A zoom level of 2.0 will make objects appear twice as large, 0.5 will
   * make them half as large, etc.
   *
   * @param zoom - The new zoom level.
   */
  zoom (zoom: NumExpr): this

  /**
   * Restricts the movement of the canvas camera to the given bounding box, centered at (0, 0). The canvas will only
   * be draggable when the camera is within the bounding box (i.e. the coordinates currently in view are a subset of the
   * bounding box).
   *
   * The default pan limit is: (-Infinity, Infinity).
   *
   * @param box - A (width/2, height/2) tuple describing the bounding box.
   */
  panLimit (box: [NumExpr, NumExpr]): this

  /**
   * Restricts the zoom level of the canvas camera to the given range. The lower bound describes how far
   * away the camera can zoom, while the upper bound describes the maximum enlarging zoom.
   *
   * The default zoom limit is: (0.1, 10).
   *
   * @param limit - A (min, max) tuple describing the zoom limit.
   */
  zoomLimit (limit: [NumExpr, NumExpr]): this
}
