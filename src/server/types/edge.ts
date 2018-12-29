import { Selection } from './selection'
import { LabelSelection } from './label'
import { ElementArg, NumExpr } from './types'

export interface EdgeSelection extends Selection {
  /**
   * Selects a single label, attached to the edge, by its ID.
   *
   * @param id - (Optional) The ID of the label. Defaults to "weight".
   *
   * @return A new selection corresponding to the given label.
   */
  label (id: string | number): LabelSelection

  /**
   * Selects multiple labels, attached to the edge, using an list of ID values.
   *
   * @param ids - An list of label IDs.
   *
   * @return A new selection corresponding to the given labels.
   */
  labels (ids: ReadonlyArray<string | number>): LabelSelection

  /**
   * Sets the length of the edge. This will only take effect when [[CanvasSelection.edgeLengths]] is set to "individual".
   *
   * @param length - The length of the edge.
   */
  length (length: ElementArg<NumExpr>): this

  /**
   * Sets whether or not the edge should be 'flipped' after exceeding a certain angle, such that it is never rendered
   * upside-down. This only applies to edges connecting two nodes.
   *
   * @param flip - True if the edge should flip automatically, false otherwise.
   */
  flip (flip: ElementArg<boolean>): this
}
